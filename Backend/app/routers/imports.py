from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.supplier import Supplier
from app.security.auth import get_current_user
from app.services.csv_service import import_supplier_catalogue

router = APIRouter(prefix="/api/imports", tags=["Imports"])
MAX_FILE_SIZE = 2 * 1024 * 1024


@router.post("/supplier-catalogue")
async def upload_supplier_catalogue(file: UploadFile = File(...), db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != "SUPPLIER": raise HTTPException(status_code=403, detail="Supplier access required")
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == current_user.id))
    if supplier is None: raise HTTPException(status_code=404, detail="Supplier profile not found")
    if not file.filename: raise HTTPException(status_code=400, detail="CSV file is required")
    if not file.filename.lower().endswith(".csv"): raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    content = await file.read()
    if len(content) > MAX_FILE_SIZE: raise HTTPException(status_code=400, detail="CSV file is too large")
    result = import_supplier_catalogue(content, supplier.id, db)
    if result["errors"]: raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=result)
    return {"message": "Supplier catalogue imported successfully", **result}
