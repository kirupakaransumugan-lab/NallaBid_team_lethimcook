from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quotation import Quotation
from app.models.rfq import RFQ, RFQStatus
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.rfq import SupplierRFQDetail, SupplierRFQListItem
from app.security.auth import get_current_user


router = APIRouter(prefix="/supplier/rfqs", tags=["Supplier RFQs"])


def require_supplier(current_user: User) -> User:
    if current_user.role != "SUPPLIER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier access required")
    return current_user


@router.get("", response_model=list[SupplierRFQListItem])
def list_open_rfqs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List every buyer RFQ that is currently open to suppliers.

    The left join only checks whether the current supplier already submitted;
    it never exposes other suppliers' bids or buyer-only data.
    """
    require_supplier(current_user)
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == current_user.id))
    supplier_id = supplier.id if supplier else -1
    now = datetime.utcnow()

    rows = db.execute(
        select(RFQ, Quotation.id)
        .outerjoin(
            Quotation,
            (Quotation.rfq_id == RFQ.id) & (Quotation.supplier_id == supplier_id),
        )
        .where(RFQ.status == RFQStatus.OPEN, RFQ.deadline > now)
        .order_by(RFQ.deadline.asc(), RFQ.id.asc())
    ).all()

    return [
        SupplierRFQListItem(
            id=rfq.id,
            rfq_number=rfq.rfq_number,
            product_name=rfq.product_name,
            description=rfq.description,
            quantity=rfq.quantity,
            max_delivery_days=rfq.max_delivery_days,
            min_warranty_months=rfq.min_warranty_months,
            deadline=rfq.deadline,
            status=rfq.status.value,
            has_submitted=quotation_id is not None,
        )
        for rfq, quotation_id in rows
    ]


@router.get("/{rfq_id}", response_model=SupplierRFQDetail)
def get_open_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the public requirements of one currently open RFQ."""
    require_supplier(current_user)
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == current_user.id))
    supplier_id = supplier.id if supplier else -1
    now = datetime.utcnow()

    row = db.execute(
        select(RFQ, Quotation.id)
        .outerjoin(
            Quotation,
            (Quotation.rfq_id == RFQ.id) & (Quotation.supplier_id == supplier_id),
        )
        .where(RFQ.id == rfq_id, RFQ.status == RFQStatus.OPEN, RFQ.deadline > now)
    ).first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Open RFQ not found")

    rfq, quotation_id = row
    return SupplierRFQDetail(
        id=rfq.id,
        rfq_number=rfq.rfq_number,
        product_name=rfq.product_name,
        description=rfq.description,
        quantity=rfq.quantity,
        max_delivery_days=rfq.max_delivery_days,
        min_warranty_months=rfq.min_warranty_months,
        deadline=rfq.deadline,
        status=rfq.status.value,
        has_submitted=quotation_id is not None,
        created_at=rfq.created_at,
    )
