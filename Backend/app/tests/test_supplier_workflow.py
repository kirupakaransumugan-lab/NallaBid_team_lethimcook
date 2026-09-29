"""Supplier RFQ and quotation tests use an isolated SQLite database."""
from datetime import datetime, timedelta
from types import SimpleNamespace
import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database import Base
import app.models  # Register all relationship targets before metadata creation.
from app.models.quotation import Quotation, QuotationStatus
from app.models.rfq import RFQ, RFQStatus
from app.models.supplier import Supplier
from app.routers.quotations import list_my_quotations
from app.routers.supplier_rfqs import get_available_rfq, list_available_rfqs, require_supplier
from app.tests.test_catalogue import sqlite_bigint  # noqa: F401 - SQLite BigInteger compiler


class SupplierWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.db.add_all([
            Supplier(id=1, user_id=11, company_name="One"),
            Supplier(id=2, user_id=22, company_name="Two"),
        ])
        now = datetime.utcnow()
        self.db.add_all([
            RFQ(id=1, rfq_number="RFQ-OPEN", buyer_id=101, product_name="Paper", quantity=10,
                max_delivery_days=5, min_warranty_months=0, deadline=now + timedelta(days=2), status=RFQStatus.OPEN),
            RFQ(id=2, rfq_number="RFQ-EXPIRED", buyer_id=101, product_name="Old", quantity=10,
                max_delivery_days=5, min_warranty_months=0, deadline=now - timedelta(days=1), status=RFQStatus.OPEN),
            RFQ(id=3, rfq_number="RFQ-CLOSED", buyer_id=101, product_name="Closed", quantity=10,
                max_delivery_days=5, min_warranty_months=0, deadline=now + timedelta(days=2), status=RFQStatus.CLOSED),
        ])
        self.db.add_all([
            Quotation(id=1, quotation_number="QTN-OWN", rfq_id=1, supplier_id=1, unit_price=10,
                      total_price=100, delivery_days=3, warranty_months=1, status=QuotationStatus.SUBMITTED),
            Quotation(id=2, quotation_number="QTN-OTHER", rfq_id=1, supplier_id=2, unit_price=12,
                      total_price=120, delivery_days=4, warranty_months=1, status=QuotationStatus.ELIGIBLE),
        ])
        self.db.commit()
        self.supplier_user = SimpleNamespace(id=11, role="SUPPLIER")

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_open_rfqs_only_and_supplier_submission_status(self):
        rows = list_available_rfqs(self.db, self.supplier_user)
        self.assertEqual([row.id for row in rows], [1])
        self.assertTrue(rows[0].has_submitted)

    def test_supplier_without_profile_can_browse_without_submission_status(self):
        rows = list_available_rfqs(self.db, SimpleNamespace(id=99, role="SUPPLIER"))
        self.assertEqual([row.id for row in rows], [1])
        self.assertFalse(rows[0].has_submitted)

    def test_detail_hides_expired_and_closed_rfqs(self):
        self.assertTrue(get_available_rfq(1, self.db, self.supplier_user).has_submitted)
        for rfq_id in (2, 3, 999):
            with self.subTest(rfq_id=rfq_id):
                with self.assertRaises(Exception) as caught:
                    get_available_rfq(rfq_id, self.db, self.supplier_user)
                self.assertEqual(caught.exception.status_code, 404)

    def test_supplier_quotation_list_is_owned_and_includes_rfq_context(self):
        rows = list_my_quotations(self.db, self.supplier_user)
        self.assertEqual([row.quotation_number for row in rows], ["QTN-OWN"])
        self.assertEqual(rows[0].rfq_number, "RFQ-OPEN")
        self.assertEqual(rows[0].product_name, "Paper")

    def test_buyer_is_rejected_from_supplier_rfq_routes(self):
        with self.assertRaises(Exception) as caught:
            require_supplier(SimpleNamespace(id=101, role="BUYER"))
        self.assertEqual(caught.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
