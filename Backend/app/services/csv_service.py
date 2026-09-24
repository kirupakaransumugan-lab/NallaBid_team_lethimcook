import csv
import io
from decimal import Decimal, InvalidOperation
from sqlalchemy.orm import Session
from app.models.supplier_catalogue import SupplierCatalogue

REQUIRED_COLUMNS = {"product_name", "description", "unit_price", "available_quantity"}

def import_supplier_catalogue(file_content: bytes, supplier_id: int, db: Session):
    try:
        decoded = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return {"imported": 0, "errors": [{"row": 0, "message": "CSV must use UTF-8 encoding"}]}
    reader = csv.DictReader(io.StringIO(decoded))
    if reader.fieldnames is None:
        return {"imported": 0, "errors": [{"row": 0, "message": "CSV header is missing"}]}
    headers = {h.strip() for h in reader.fieldnames if h}
    missing = REQUIRED_COLUMNS - headers
    if missing:
        return {"imported": 0, "errors": [{"row": 0, "message": "Missing columns: " + ", ".join(sorted(missing))}]}
    records, errors = [], []
    for row_number, row in enumerate(reader, start=2):
        product_name = (row.get("product_name") or "").strip()
        description = (row.get("description") or "").strip() or None
        if not product_name:
            errors.append({"row": row_number, "message": "product_name is required"}); continue
        try:
            unit_price = Decimal((row.get("unit_price") or "").strip())
            if unit_price < 0: raise ValueError
        except (InvalidOperation, ValueError):
            errors.append({"row": row_number, "message": "unit_price must be a valid non-negative number"}); continue
        try:
            qty = int((row.get("available_quantity") or "").strip())
            if qty < 0: raise ValueError
        except ValueError:
            errors.append({"row": row_number, "message": "available_quantity must be a non-negative integer"}); continue
        records.append(SupplierCatalogue(supplier_id=supplier_id, product_name=product_name, description=description, unit_price=unit_price, available_quantity=qty))
    if errors: return {"imported": 0, "errors": errors}
    db.add_all(records); db.commit()
    return {"imported": len(records), "errors": []}
