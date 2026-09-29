"""Uses an isolated SQLite database, never the team database."""
import asyncio
import io
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from fastapi import HTTPException, UploadFile
from sqlalchemy import BigInteger, create_engine, select
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session
from app.database import Base
import app.models
from app.models.supplier import Supplier
from app.models.supplier_catalogue import SupplierCatalogue
from app.routers.imports import MAX_FILE_SIZE, upload_supplier_catalogue
from app.routers.suppliers import get_my_catalogue
from app.services.csv_service import import_supplier_catalogue
from app.services.supplier_service import require_supplier_profile

@compiles(BigInteger, "sqlite")
def sqlite_bigint(element, compiler, **kw):
    return "INTEGER"

HEADER = b"product_name,description,unit_price,available_quantity\n"

class CatalogueTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.db.add_all([Supplier(id=1, user_id=11, company_name="One"), Supplier(id=2, user_id=22, company_name="Two")])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def upload(self, rows, supplier=1):
        return import_supplier_catalogue(HEADER + rows, supplier, self.db)

    def test_repeat_and_ownership(self):
        self.assertEqual(self.upload(b"Paper,A4,10,5\n")["created"], 1)
        self.upload(b"Paper,Other,20,9\n", 2)
        result = self.upload(b" PAPER ,Updated,12.50,7\n")
        self.assertEqual((result["created"], result["updated"]), (0, 1))
        own = get_my_catalogue(self.db, self.db.get(Supplier, 1))
        other = get_my_catalogue(self.db, self.db.get(Supplier, 2))
        self.assertEqual(len(own), 1)
        self.assertEqual(own[0].available_quantity, 7)
        self.assertEqual(other[0].available_quantity, 9)

    def test_legacy_duplicates_preserved(self):
        self.upload(b"Paper,A4,10,5\n")
        self.db.add(SupplierCatalogue(supplier_id=1, product_name=" paper ", available_quantity=99))
        self.db.commit()
        result = self.upload(b"PAPER,New,11,3\n")
        rows = get_my_catalogue(self.db, self.db.get(Supplier, 1))
        self.assertEqual(result["duplicate_rows_updated"], 1)
        self.assertEqual([row.available_quantity for row in rows], [3, 3])

    def test_validation_is_atomic(self):
        cases = [b"", b"product_name\nPaper\n", HEADER,
                 *[HEADER + f"Paper,A4,{price},{qty}\n".encode() for price, qty in
                   [("-1", "2"), ("NaN", "2"), ("Infinity", "2"), ("1.001", "2"),
                    ("10000000000", "2"), ("1", "-2"), ("1", "2.5"), ("1", "2147483648")]],
                 HEADER + b"Paper,A4,1\n", HEADER + b"Paper,A4,1,2,extra\n",
                 HEADER + b'"Paper,A4,1,2\n', HEADER + b"\xff,A4,1,2\n",
                 HEADER + b"Paper,A4,1,2\n paper ,A4,2,3\n",
                 HEADER + b"Good,A4,1,2\nBad,A4,invalid,2\n"]
        for content in cases:
            with self.subTest(content=content):
                self.assertTrue(import_supplier_catalogue(content, 1, self.db)["errors"])
                self.assertEqual(self.db.scalars(select(SupplierCatalogue)).all(), [])

    def test_bom_spaces_and_zero(self):
        result = import_supplier_catalogue(b'\xef\xbb\xbf product_name , description ,unit_price,available_quantity\nPaper,"A4, white",0,0\n', 1, self.db)
        self.assertEqual(result["created"], 1)

    def test_rollback(self):
        self.upload(b"Paper,A4,1,2\n")
        def fail_commit():
            self.db.flush()
            raise RuntimeError("simulated failure")
        with patch.object(self.db, "commit", side_effect=fail_commit):
            with self.assertRaises(RuntimeError):
                self.upload(b"Paper,A4,2,99\nNew,New,3,4\n")
        rows = self.db.scalars(select(SupplierCatalogue)).all()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].available_quantity, 2)

    def test_role_and_profile(self):
        for user, status in [(SimpleNamespace(id=11, role="BUYER"), 403), (SimpleNamespace(id=33, role="SUPPLIER"), 404)]:
            with self.assertRaises(HTTPException) as caught:
                require_supplier_profile(self.db, user)
            self.assertEqual(caught.exception.status_code, status)
        self.assertEqual(require_supplier_profile(self.db, SimpleNamespace(id=11, role="SUPPLIER")).id, 1)

    def test_upload_limits(self):
        for name, content, status in [("bad.txt", HEADER, 400), ("big.csv", b"x" * (MAX_FILE_SIZE + 1), 400), ("empty.csv", b"", 422)]:
            with self.assertRaises(HTTPException) as caught:
                asyncio.run(upload_supplier_catalogue(UploadFile(filename=name, file=io.BytesIO(content)), self.db, self.db.get(Supplier, 1)))
            self.assertEqual(caught.exception.status_code, status)

if __name__ == "__main__":
    unittest.main()
