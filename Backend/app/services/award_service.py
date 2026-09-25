from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.award import Award, AwardStatus
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.quotation import Quotation, QuotationStatus
from app.models.rfq import RFQ, RFQStatus
from app.models.supplier import Supplier
from app.models.user import User
from app.services.evaluation_service import get_owned_rfq


# =========================================================
# Create award
# =========================================================

def create_award(db: Session, rfq_id: int, quotation_id: int, buyer: User) -> Award:
    # Row lock on the RFQ: a second concurrent award request for the same RFQ
    # waits here, then sees status AWARDED below and gets 409.
    rfq = get_owned_rfq(db, rfq_id, buyer, lock=True)

    if rfq.status in (RFQStatus.AWARDED, RFQStatus.COMPLETED):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This RFQ has already been awarded")

    existing_award = db.scalar(select(Award).where(Award.rfq_id == rfq.id))

    if existing_award is not None:
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
        # UNIQUE(rfq_id) / UNIQUE(quotation_id) caught a race the lock did not.
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This RFQ has already been awarded")

    db.refresh(award)
    return award


# =========================================================
# Complete award
# =========================================================

def complete_award(db: Session, rfq_id: int, buyer: User) -> Award:
    rfq = get_owned_rfq(db, rfq_id, buyer, lock=True)

    award = db.scalar(select(Award).where(Award.rfq_id == rfq.id))

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
# Buyer: award detail
# =========================================================

def get_award_detail(db: Session, rfq_id: int, buyer: User) -> dict:
    rfq = get_owned_rfq(db, rfq_id, buyer)

    row = db.execute(
        select(Award, Quotation, Supplier, User.full_name)
        .join(Quotation, Quotation.id == Award.quotation_id)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .join(User, User.id == Award.awarded_by)
        .where(Award.rfq_id == rfq.id)
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

    award = db.scalar(select(Award).where(Award.rfq_id == rfq.id))

    # Only reveal whether *this* supplier won; the winner's identity and price stay private.
    if award is None:
        outcome = "PENDING"
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
