from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.supplier import Supplier
from app.services.supplier_service import require_supplier_profile
from app.services.csv_service import import_supplier_catalogue

router = APIRouter(prefix="/api/imports", tags=["Imports"])
MAX_FILE_SIZE = 2 * 1024 * 1024


@router.post("/supplier-catalogue")
async def upload_supplier_catalogue(
    file: UploadFile = File(...), db: Session = Depends(get_db),
    supplier: Supplier = Depends(require_supplier_profile),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="CSV file is required")
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="CSV file is too large (maximum 2 MiB)")
    result = import_supplier_catalogue(content, supplier.id, db)
    if result["errors"]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=result)
    return {"message": "Supplier catalogue imported successfully", **result}
