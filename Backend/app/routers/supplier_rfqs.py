from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quotation import Quotation
from app.models.rfq import RFQ, RFQStatus
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.supplier_rfq import SupplierRFQDetail, SupplierRFQListItem
from app.security.auth import get_current_user


router = APIRouter(prefix="/supplier/rfqs", tags=["Supplier RFQs"])


def require_supplier(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "SUPPLIER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier access required")
    return current_user


def supplier_id_for_user(db: Session, user_id: int) -> int | None:
    return db.scalar(select(Supplier.id).where(Supplier.user_id == user_id))


@router.get("", response_model=list[SupplierRFQListItem])
def list_available_rfqs(
    db: Session = Depends(get_db), current_user: User = Depends(require_supplier)
):
    supplier_id = supplier_id_for_user(db, current_user.id)
    submitted = (
        select(Quotation.rfq_id).where(Quotation.supplier_id == supplier_id).subquery()
        if supplier_id is not None
        else None
    )
    rows = db.scalars(
        select(RFQ)
        .where(RFQ.status == RFQStatus.OPEN, RFQ.deadline > datetime.utcnow())
        .order_by(RFQ.deadline.asc(), RFQ.id.asc())
    ).all()
    submitted_ids = set(db.scalars(select(submitted.c.rfq_id)).all()) if submitted is not None else set()
    return [
        SupplierRFQListItem(
            id=rfq.id,
            rfq_number=rfq.rfq_number,
            product_name=rfq.product_name,
            quantity=rfq.quantity,
            max_delivery_days=rfq.max_delivery_days,
            min_warranty_months=rfq.min_warranty_months,
            deadline=rfq.deadline,
            status=rfq.status,
            has_submitted=rfq.id in submitted_ids,
        )
        for rfq in rows
    ]


@router.get("/{rfq_id}", response_model=SupplierRFQDetail)
def get_available_rfq(
    rfq_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_supplier)
):
    rfq = db.scalar(
        select(RFQ).where(
            RFQ.id == rfq_id,
            RFQ.status == RFQStatus.OPEN,
            RFQ.deadline > datetime.utcnow(),
        )
    )
    if rfq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open RFQ not found")
    supplier_id = supplier_id_for_user(db, current_user.id)
    has_submitted = supplier_id is not None and db.scalar(
        select(Quotation.id).where(Quotation.rfq_id == rfq.id, Quotation.supplier_id == supplier_id)
    ) is not None
    return SupplierRFQDetail(
        id=rfq.id,
        rfq_number=rfq.rfq_number,
        product_name=rfq.product_name,
        description=rfq.description,
        quantity=rfq.quantity,
        max_delivery_days=rfq.max_delivery_days,
        min_warranty_months=rfq.min_warranty_months,
        deadline=rfq.deadline,
        status=rfq.status,
        has_submitted=has_submitted,
    )
