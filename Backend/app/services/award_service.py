from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.award import ACTIVE_AWARD, Award, AwardStatus
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.quotation import Quotation, QuotationStatus
from app.models.rfq import RFQ, RFQStatus
from app.models.supplier import Supplier
from app.models.user import User
from app.services.evaluation_service import get_owned_rfq


def get_active_award(db: Session, rfq_id: int) -> Award | None:
    """The RFQ's current award; cancelled awards are history, not winners."""
    return db.scalar(select(Award).where(Award.rfq_id == rfq_id, ACTIVE_AWARD))


# =========================================================
# Create award
# =========================================================

def create_award(db: Session, rfq_id: int, quotation_id: int, buyer: User) -> Award:
    # Row lock on the RFQ: a second concurrent award request for the same RFQ
    # waits here, then sees status AWARDED below and gets 409.
    rfq = get_owned_rfq(db, rfq_id, buyer, lock=True)

    if rfq.status in (RFQStatus.AWARDED, RFQStatus.COMPLETED):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This RFQ has already been awarded")

    if get_active_award(db, rfq.id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This RFQ has already been awarded")

    if rfq.status != RFQStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only closed and evaluated RFQs can be awarded",
        )

    quotation = db.get(Quotation, quotation_id)

    if quotation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quotation not found")

    if quotation.rfq_id != rfq.id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="This quotation does not belong to the selected RFQ",
        )

    # A quotation whose award was cancelled (e.g. the supplier withdrew) cannot win again.
    previously_cancelled = db.scalar(
        select(Award.id).where(Award.quotation_id == quotation.id, Award.status == AwardStatus.CANCELLED)
    )

    if previously_cancelled is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="This quotation's award was cancelled; choose another quotation",
        )

    evaluation = db.scalar(select(Evaluation).where(Evaluation.quotation_id == quotation.id))

    if evaluation is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="This quotation has not been evaluated yet",
        )

    if evaluation.overall_status != EvaluationStatus.ELIGIBLE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Only eligible quotations can be awarded",
        )

    award = Award(
        rfq_id=rfq.id,
        quotation_id=quotation.id,
        awarded_by=buyer.id,
        awarded_at=datetime.utcnow(),
        status=AwardStatus.AWARDED,
    )

    db.add(award)
    quotation.status = QuotationStatus.AWARDED
    rfq.status = RFQStatus.AWARDED
    rfq.updated_at = datetime.utcnow()

    try:
        db.commit()
    except IntegrityError:
        # UNIQUE(active_rfq_id) caught a race the lock did not.
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This RFQ has already been awarded")

    db.refresh(award)
    return award


# =========================================================
# Complete award
# =========================================================

def complete_award(db: Session, rfq_id: int, buyer: User) -> Award:
    rfq = get_owned_rfq(db, rfq_id, buyer, lock=True)

    award = get_active_award(db, rfq.id)

    if award is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This RFQ has no award")

    if rfq.status == RFQStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This RFQ is already completed")

    if rfq.status != RFQStatus.AWARDED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only awarded RFQs can be completed")

    rfq.status = RFQStatus.COMPLETED
    rfq.updated_at = datetime.utcnow()
    award.status = AwardStatus.COMPLETED

    db.commit()
    db.refresh(award)
    return award


# =========================================================
# Cancel award (wrong choice, or the supplier withdrew)
# =========================================================

def cancel_award(db: Session, rfq_id: int, reason: str, buyer: User) -> Award:
    rfq = get_owned_rfq(db, rfq_id, buyer, lock=True)

    award = get_active_award(db, rfq.id)

    if award is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This RFQ has no active award")

    # Completed means the goods were delivered; that is final.
    if award.status == AwardStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A completed award cannot be cancelled")

    now = datetime.utcnow()

    # The row is kept as history; only its status changes.
    award.status = AwardStatus.CANCELLED
    award.cancelled_at = now
    award.cancelled_by = buyer.id
    award.cancel_reason = reason

    # The quotation still met the requirements, so it goes back to ELIGIBLE, but
    # create_award refuses it; the RFQ returns to CLOSED so another can be chosen.
    quotation = db.get(Quotation, award.quotation_id)
    quotation.status = QuotationStatus.ELIGIBLE
    rfq.status = RFQStatus.CLOSED
    rfq.updated_at = now

    db.commit()
    db.refresh(award)
    return award


def list_cancelled_awards(db: Session, rfq_id: int) -> list[dict]:
    rows = db.execute(
        select(Award, Quotation.quotation_number, Supplier.company_name, User.full_name)
        .join(Quotation, Quotation.id == Award.quotation_id)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .outerjoin(User, User.id == Award.cancelled_by)
        .where(Award.rfq_id == rfq_id, Award.status == AwardStatus.CANCELLED)
        .order_by(Award.cancelled_at.desc())
    ).all()

    return [
        {
            "award_id": award.id,
            "quotation_id": award.quotation_id,
            "quotation_number": quotation_number,
            "supplier_name": supplier_name,
            "awarded_at": award.awarded_at,
            "cancelled_at": award.cancelled_at,
            "cancelled_by_name": cancelled_by_name,
            "cancel_reason": award.cancel_reason,
        }
        for award, quotation_number, supplier_name, cancelled_by_name in rows
    ]


# =========================================================
# Buyer: award detail
# =========================================================

def get_award_detail(db: Session, rfq_id: int, buyer: User) -> dict:
    rfq = get_owned_rfq(db, rfq_id, buyer)

    row = db.execute(
        select(Award, Quotation, Supplier, User.full_name)
        .join(Quotation, Quotation.id == Award.quotation_id)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .join(User, User.id == Award.awarded_by)
        .where(Award.rfq_id == rfq.id, ACTIVE_AWARD)
    ).first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="This RFQ has not been awarded yet")

    award, quotation, supplier, awarded_by_name = row

    return {
        "id": award.id,
        "status": award.status,
        "awarded_at": award.awarded_at,
        "awarded_by": award.awarded_by,
        "awarded_by_name": awarded_by_name,
        "rfq_id": rfq.id,
        "rfq_number": rfq.rfq_number,
        "product_name": rfq.product_name,
        "quantity": rfq.quantity,
        "rfq_status": rfq.status.value,
        "max_delivery_days": rfq.max_delivery_days,
        "min_warranty_months": rfq.min_warranty_months,
        "quotation_id": quotation.id,
        "quotation_number": quotation.quotation_number,
        "unit_price": quotation.unit_price,
        "awarded_amount": quotation.total_price,
        "delivery_days": quotation.delivery_days,
        "warranty_months": quotation.warranty_months,
        "supplier_id": supplier.id,
        "supplier_name": supplier.company_name,
        "supplier_email": supplier.email,
        "supplier_phone": supplier.phone,
    }


# =========================================================
# Supplier: own award result
# =========================================================

def get_supplier_award_result(db: Session, rfq_id: int, user: User) -> dict:
    if user.role != "SUPPLIER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Supplier access required")

    supplier = db.scalar(select(Supplier).where(Supplier.user_id == user.id))

    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier profile not found")

    rfq = db.get(RFQ, rfq_id)

    if rfq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")

    quotation = db.scalar(
        select(Quotation).where(Quotation.rfq_id == rfq.id, Quotation.supplier_id == supplier.id)
    )

    if quotation is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You did not submit a quotation for this RFQ",
        )

    award = get_active_award(db, rfq.id)

    own_award_cancelled = db.scalar(
        select(Award.id).where(Award.quotation_id == quotation.id, Award.status == AwardStatus.CANCELLED)
    ) is not None

    # Only reveal whether *this* supplier won; the winner's identity and price stay private.
    # A supplier whose own award was cancelled is no longer in the running.
    if award is None:
        outcome = "NOT_AWARDED" if own_award_cancelled else "PENDING"
    elif award.quotation_id == quotation.id:
        outcome = "AWARDED"
    else:
        outcome = "NOT_AWARDED"

    is_winner = outcome == "AWARDED"

    return {
        "rfq_id": rfq.id,
        "rfq_number": rfq.rfq_number,
        "product_name": rfq.product_name,
        "quantity": rfq.quantity,
        "rfq_status": rfq.status.value,
        "quotation_id": quotation.id,
        "quotation_number": quotation.quotation_number,
        "unit_price": quotation.unit_price,
        "total_price": quotation.total_price,
        "delivery_days": quotation.delivery_days,
        "warranty_months": quotation.warranty_months,
        "quotation_status": quotation.status,
        "outcome": outcome,
        "award_status": award.status if is_winner else None,
        "awarded_at": award.awarded_at if is_winner else None,
    }
