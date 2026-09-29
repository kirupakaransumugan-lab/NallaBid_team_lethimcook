import csv
import io
from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.supplier import Supplier
from app.models.supplier_catalogue import SupplierCatalogue

REQUIRED_COLUMNS = {"product_name", "description", "unit_price", "available_quantity"}


def import_supplier_catalogue(file_content: bytes, supplier_id: int, db: Session):
    def failure(errors):
        return {"imported": 0, "created": 0, "updated": 0, "errors": errors}

    try:
        decoded = file_content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return failure([{"row": 0, "message": "CSV must use UTF-8 encoding"}])
    records, errors = {}, []
    reader = csv.DictReader(io.StringIO(decoded, newline=""), strict=True)
    try:
        if not reader.fieldnames:
            return failure([{"row": 0, "message": "CSV header is missing"}])
        headers = [h.strip() for h in reader.fieldnames]
        missing = REQUIRED_COLUMNS - set(headers)
        if missing:
            return failure([{"row": 1, "message": "Missing columns: " + ", ".join(sorted(missing))}])
        if len(headers) != len(set(headers)) or "" in headers:
            return failure([{"row": 1, "message": "CSV column names must be non-empty and unique"}])
        reader.fieldnames = headers
        for row in reader:
            row_number = reader.line_num
            try:
                if None in row or any(value is None for value in row.values()):
                    raise ValueError("Row must have the same number of fields as the header")
                if any("\x00" in value for value in row.values()):
                    raise ValueError("CSV must not contain null characters")
                name = row["product_name"].strip()
                if not name or len(name) > 150:
                    raise ValueError("product_name must contain 1–150 characters")
                description = row["description"].strip() or None
                if description and len(description.encode("utf-8")) > 65535:
                    raise ValueError("description is too long (maximum 65535 UTF-8 bytes)")
                try:
                    price = Decimal(row["unit_price"].strip())
                    if not price.is_finite() or price < 0 or price > Decimal("9999999999.99"):
                        raise InvalidOperation
                    if price != price.quantize(Decimal("0.01")):
                        raise InvalidOperation
                except (InvalidOperation, ValueError):
                    raise ValueError("unit_price must be a non-negative number up to 9999999999.99 with at most 2 decimal places")
                try:
                    qty = int(row["available_quantity"].strip())
                    if qty < 0 or qty > 2147483647:
                        raise ValueError
                except ValueError:
                    raise ValueError("available_quantity must be a whole number between 0 and 2147483647")
                # Same identity as evaluation's trimmed, case-insensitive name match.
                key = name.lower()
                if key in records:
                    raise ValueError("Duplicate product_name in CSV; include each product only once")
                records[key] = dict(product_name=name, description=description, unit_price=price, available_quantity=qty)
            except ValueError as exc:
                errors.append({"row": row_number, "message": str(exc)})
    except csv.Error as exc:
        errors.append({"row": reader.line_num, "message": f"Malformed CSV: {exc}"})
    if errors:
        return failure(errors)
    if not records:
        return failure([{"row": 0, "message": "CSV must contain at least one product row"}])

    created = updated = duplicate_rows_updated = 0
    try:
        # Serialize imports for one supplier, including when their catalogue is empty.
        db.execute(select(Supplier.id).where(Supplier.id == supplier_id).with_for_update()).scalar_one()
        existing = {}
        for item in db.scalars(select(SupplierCatalogue).where(
            SupplierCatalogue.supplier_id == supplier_id
        ).with_for_update()).all():
            existing.setdefault(item.product_name.strip().lower(), []).append(item)
        for key, values in records.items():
            matches = existing.get(key, [])
            if matches:
                # Preserve legacy duplicates, but keep their stock consistent for evaluation.
                for item in matches:
                    for field, value in values.items():
                        setattr(item, field, value)
                updated += 1
                duplicate_rows_updated += len(matches) - 1
            else:
                db.add(SupplierCatalogue(supplier_id=supplier_id, **values))
                created += 1
        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"imported": len(records), "created": created, "updated": updated,
            "duplicate_rows_updated": duplicate_rows_updated, "errors": []}
