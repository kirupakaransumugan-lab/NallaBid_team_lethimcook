from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quotation import Quotation, QuotationStatus
from app.models.rfq import RFQ
from app.models.supplier import Supplier
from app.schemas.quotation import QuotationCreate, QuotationResponse, QuotationUpdate
from app.security.auth import get_current_user

router = APIRouter(tags=["Quotations"])

def get_current_supplier(db: Session, current_user) -> Supplier:
    if current_user.role != "SUPPLIER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier access required")
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == current_user.id))
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier profile not found")
    return supplier

def generate_quotation_number() -> str:
    return f"QTN-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"

@router.post("/api/rfqs/{rfq_id}/quotations", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
def create_quotation(rfq_id: int, data: QuotationCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    supplier = get_current_supplier(db, current_user)
    rfq = db.get(RFQ, rfq_id)
    if rfq is None:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq.status != "OPEN":
        raise HTTPException(status_code=409, detail="RFQ is not open for quotations")
    if datetime.utcnow() >= rfq.deadline:
        raise HTTPException(status_code=409, detail="RFQ deadline has passed")
    existing = db.scalar(select(Quotation).where(Quotation.rfq_id == rfq_id, Quotation.supplier_id == supplier.id))
    if existing is not None:
        raise HTTPException(status_code=409, detail="You have already submitted a quotation for this RFQ")
    quotation = Quotation(quotation_number=generate_quotation_number(), rfq_id=rfq.id, supplier_id=supplier.id, unit_price=data.unit_price, total_price=Decimal(data.unit_price) * Decimal(rfq.quantity), delivery_days=data.delivery_days, warranty_months=data.warranty_months, notes=data.notes, status=QuotationStatus.SUBMITTED)
    db.add(quotation)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Quotation already exists for this RFQ")
    db.refresh(quotation)
    return quotation

@router.get("/api/quotations/{quotation_id}", response_model=QuotationResponse)
def get_quotation(quotation_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    supplier = get_current_supplier(db, current_user)
    quotation = db.get(Quotation, quotation_id)
    if quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if quotation.supplier_id != supplier.id:
        raise HTTPException(status_code=403, detail="You cannot view another supplier's quotation")
    return quotation

@router.put("/api/quotations/{quotation_id}", response_model=QuotationResponse)
def update_quotation(quotation_id: int, data: QuotationUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    supplier = get_current_supplier(db, current_user)
    quotation = db.get(Quotation, quotation_id)
    if quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if quotation.supplier_id != supplier.id:
        raise HTTPException(status_code=403, detail="You cannot edit another supplier's quotation")
    rfq = db.get(RFQ, quotation.rfq_id)
    if rfq is None:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if datetime.utcnow() >= rfq.deadline:
        raise HTTPException(status_code=409, detail="Quotation cannot be edited after the RFQ deadline")
    if rfq.status != "OPEN":
        raise HTTPException(status_code=409, detail="RFQ is not open for quotation editing")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(quotation, field, value)
    quotation.total_price = Decimal(quotation.unit_price) * Decimal(rfq.quantity)
    db.commit(); db.refresh(quotation)
    return quotation
