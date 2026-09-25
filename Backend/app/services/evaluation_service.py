from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.award import Award
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.quotation import Quotation, QuotationStatus
from app.models.rfq import RFQ, RFQStatus
from app.models.supplier import Supplier
from app.models.supplier_catalogue import SupplierCatalogue
from app.models.user import User


# =========================================================
# Shared helpers (also used by awards and reports)
# =========================================================

def get_owned_rfq(db: Session, rfq_id: int, buyer: User, lock: bool = False) -> RFQ:
    """Load an RFQ and make sure it belongs to the buyer.

    lock=True issues SELECT ... FOR UPDATE so concurrent state changes on the same
    RFQ (e.g. two award attempts) run one after the other.
    """
    stmt = select(RFQ).where(RFQ.id == rfq_id)

    if lock:
        stmt = stmt.with_for_update()

    rfq = db.scalar(stmt)

    if rfq is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")

    if rfq.buyer_id != buyer.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this RFQ")

    return rfq


def find_available_quantity(db: Session, supplier_id: int, product_name: str) -> int | None:
    """How many units of the RFQ product the supplier's catalogue says they can supply.

    Returns None when the supplier has no catalogue entry for the product.
    """
    # TODO(human): decide how a catalogue row matches the RFQ product and how
    # multiple matching rows combine. Placeholder: exact, case-insensitive name
    # match, taking the largest available_quantity.
    return db.scalar(
        select(func.max(SupplierCatalogue.available_quantity)).where(
            SupplierCatalogue.supplier_id == supplier_id,
            func.lower(func.trim(SupplierCatalogue.product_name)) == product_name.strip().lower(),
        )
    )


def check_quotation(quotation: Quotation, rfq: RFQ, available_quantity: int | None) -> dict:
    """Apply the NallaBid eligibility rules to one quotation (no DB writes)."""
    delivery_pass = quotation.delivery_days <= rfq.max_delivery_days
    warranty_pass = quotation.warranty_months >= rfq.min_warranty_months
    quantity_pass = available_quantity is not None and available_quantity >= rfq.quantity

    reasons = []

    if not delivery_pass:
        reasons.append(
            f"Delivery {quotation.delivery_days} days exceeds maximum {rfq.max_delivery_days} days"
        )

    if not warranty_pass:
        reasons.append(
            f"Warranty {quotation.warranty_months} months is below minimum {rfq.min_warranty_months} months"
        )

    if not quantity_pass:
        if available_quantity is None:
            reasons.append("No catalogue stock found for the requested product")
        else:
            reasons.append(
                f"Available quantity {available_quantity} is below requested {rfq.quantity}"
            )

    eligible = delivery_pass and warranty_pass and quantity_pass

    return {
        "delivery_pass": delivery_pass,
        "warranty_pass": warranty_pass,
        "quantity_pass": quantity_pass,
        "overall_status": EvaluationStatus.ELIGIBLE if eligible else EvaluationStatus.INELIGIBLE,
        "failure_reason": "; ".join(reasons) or None,
    }


# =========================================================
# Run evaluation for an RFQ
# =========================================================

def run_rfq_evaluation(db: Session, rfq_id: int, buyer: User) -> dict:
    rfq = get_owned_rfq(db, rfq_id, buyer, lock=True)

    if rfq.status in (RFQStatus.AWARDED, RFQStatus.COMPLETED):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This RFQ has already been awarded; evaluations are locked",
        )

    if rfq.status != RFQStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Close the RFQ before evaluating quotations",
        )

    quotations = db.scalars(select(Quotation).where(Quotation.rfq_id == rfq.id)).all()

    if not quotations:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="This RFQ has no quotations to evaluate",
        )

    existing = {
        evaluation.quotation_id: evaluation
        for evaluation in db.scalars(
            select(Evaluation).where(Evaluation.quotation_id.in_([q.id for q in quotations]))
        ).all()
    }

    now = datetime.utcnow()
    eligible_count = 0

    for quotation in quotations:
        available = find_available_quantity(db, quotation.supplier_id, rfq.product_name)
        result = check_quotation(quotation, rfq, available)

        # Re-running an evaluation updates the row; evaluations.quotation_id is UNIQUE.
        evaluation = existing.get(quotation.id)

        if evaluation is None:
            evaluation = Evaluation(quotation_id=quotation.id)
            db.add(evaluation)

        for field, value in result.items():
            setattr(evaluation, field, value)

        evaluation.evaluated_at = now

        if result["overall_status"] == EvaluationStatus.ELIGIBLE:
            quotation.status = QuotationStatus.ELIGIBLE
            eligible_count += 1
        else:
            quotation.status = QuotationStatus.INELIGIBLE

    db.commit()

    return {
        "message": "Evaluation completed",
        "rfq_id": rfq.id,
        "evaluated_count": len(quotations),
        "eligible_count": eligible_count,
        "ineligible_count": len(quotations) - eligible_count,
    }


# =========================================================
# Buyer overview: RFQ + quotations + evaluations + award
# =========================================================

def get_rfq_evaluation_overview(db: Session, rfq_id: int, buyer: User) -> dict:
    rfq = get_owned_rfq(db, rfq_id, buyer)

    rows = db.execute(
        select(Quotation, Supplier.company_name, Evaluation)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .outerjoin(Evaluation, Evaluation.quotation_id == Quotation.id)
        .where(Quotation.rfq_id == rfq.id)
        .order_by(Quotation.total_price.asc(), Quotation.id.asc())
    ).all()

    award = db.scalar(select(Award).where(Award.rfq_id == rfq.id))

    quotations = []
    eligible = ineligible = 0

    for quotation, supplier_name, evaluation in rows:
        if evaluation is not None:
            if evaluation.overall_status == EvaluationStatus.ELIGIBLE:
                eligible += 1
            else:
                ineligible += 1

        quotations.append({
            "id": quotation.id,
            "quotation_number": quotation.quotation_number,
            "supplier_id": quotation.supplier_id,
            "supplier_name": supplier_name,
            "unit_price": quotation.unit_price,
            "total_price": quotation.total_price,
            "delivery_days": quotation.delivery_days,
            "warranty_months": quotation.warranty_months,
            "notes": quotation.notes,
            "status": quotation.status,
            "submitted_at": quotation.submitted_at,
            "evaluation": evaluation,
            "is_awarded": award is not None and award.quotation_id == quotation.id,
        })

    return {
        "rfq": rfq,
        "total_quotations": len(quotations),
        "evaluated_quotations": eligible + ineligible,
        "eligible_quotations": eligible,
        "ineligible_quotations": ineligible,
        "quotations": quotations,
        "award": award,
    }
