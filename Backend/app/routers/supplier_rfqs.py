from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
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


CLOSED_RFQ_LIMIT = 50


@router.get("", response_model=list[SupplierRFQListItem])
def list_open_rfqs(
    scope: Literal["open", "closed"] = "open",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List buyer RFQs for suppliers: open ones, or ones whose deadline has passed.

    The left join only checks whether the current supplier already submitted;
    it never exposes other suppliers' bids or buyer-only data.
    """
    require_supplier(current_user)
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == current_user.id))
    supplier_id = supplier.id if supplier else -1
    now = datetime.utcnow()

    stmt = select(RFQ, Quotation.id).outerjoin(
        Quotation,
        (Quotation.rfq_id == RFQ.id) & (Quotation.supplier_id == supplier_id),
    )

    if scope == "open":
        stmt = stmt.where(RFQ.status == RFQStatus.OPEN, RFQ.deadline > now).order_by(RFQ.deadline.asc(), RFQ.id.asc())
    else:
        # Expired RFQs may still be OPEN until a buyer request runs close_expired_rfqs.
        stmt = (
            stmt.where(or_(
                RFQ.status.in_((RFQStatus.CLOSED, RFQStatus.AWARDED, RFQStatus.COMPLETED)),
                (RFQ.status == RFQStatus.OPEN) & (RFQ.deadline <= now),
            ))
            .order_by(RFQ.deadline.desc(), RFQ.id.desc())
            .limit(CLOSED_RFQ_LIMIT)
        )

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
            status=RFQStatus.CLOSED.value if rfq.status == RFQStatus.OPEN and rfq.deadline <= now else rfq.status.value,
            has_submitted=quotation_id is not None,
        )
        for rfq, quotation_id in db.execute(stmt).all()
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
