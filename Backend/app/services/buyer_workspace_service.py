from collections import defaultdict
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.award import Award
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.quotation import Quotation, QuotationStatus
from app.models.rfq import RFQ
from app.models.supplier import Supplier
from app.models.supplier_catalogue import SupplierCatalogue
from app.models.user import User
from app.services.evaluation_service import get_owned_rfq
from app.services.reports import list_rfq_options


def _eligibility(evaluation: Evaluation | None) -> str:
    return evaluation.overall_status.value if evaluation else "PENDING"


# =========================================================
# Quotations tab: every quotation received on the buyer's RFQs
# =========================================================

def get_received_quotations(
    db: Session,
    buyer: User,
    rfq_id: int | None,
    quotation_status: QuotationStatus | None,
) -> dict:
    stmt = (
        select(Quotation, RFQ, Supplier.company_name, Evaluation, Award.id)
        .join(RFQ, RFQ.id == Quotation.rfq_id)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .outerjoin(Evaluation, Evaluation.quotation_id == Quotation.id)
        .outerjoin(Award, Award.quotation_id == Quotation.id)
        .where(RFQ.buyer_id == buyer.id)
        .order_by(Quotation.submitted_at.desc())
    )

    if rfq_id is not None:
        get_owned_rfq(db, rfq_id, buyer)  # 404 / 403 for a bad or foreign RFQ
        stmt = stmt.where(Quotation.rfq_id == rfq_id)

    if quotation_status is not None:
        stmt = stmt.where(Quotation.status == quotation_status)

    quotations = []

    for quotation, rfq, supplier_name, evaluation, award_id in db.execute(stmt).all():
        quotations.append({
            "id": quotation.id,
            "quotation_number": quotation.quotation_number,
            "rfq_id": rfq.id,
            "rfq_number": rfq.rfq_number,
            "product_name": rfq.product_name,
            "rfq_status": rfq.status.value,
            "supplier_id": quotation.supplier_id,
            "supplier_name": supplier_name,
            "unit_price": quotation.unit_price,
            "total_price": quotation.total_price,
            "delivery_days": quotation.delivery_days,
            "warranty_months": quotation.warranty_months,
            "notes": quotation.notes,
            "status": quotation.status.value,
            "eligibility": _eligibility(evaluation),
            "failure_reason": evaluation.failure_reason if evaluation else None,
            "submitted_at": quotation.submitted_at,
            "is_awarded": award_id is not None,
        })

    # Stats always describe all of the buyer's quotations, not just the filtered page.
    counts = db.execute(
        select(
            func.count(Quotation.id),
            func.sum(case((Evaluation.id.is_(None), 1), else_=0)),
            func.sum(case((Evaluation.overall_status == EvaluationStatus.ELIGIBLE, 1), else_=0)),
            func.sum(case((Evaluation.overall_status == EvaluationStatus.INELIGIBLE, 1), else_=0)),
            func.count(Award.id),
            func.count(func.distinct(Quotation.rfq_id)),
        )
        .select_from(Quotation)
        .join(RFQ, RFQ.id == Quotation.rfq_id)
        .outerjoin(Evaluation, Evaluation.quotation_id == Quotation.id)
        .outerjoin(Award, Award.quotation_id == Quotation.id)
        .where(RFQ.buyer_id == buyer.id)
    ).one()

    total, pending, eligible, ineligible, awarded, rfq_count = counts

    return {
        "stats": {
            "total": total or 0,
            "pending_evaluation": pending or 0,
            "eligible": eligible or 0,
            "ineligible": ineligible or 0,
            "awarded": awarded or 0,
            "rfqs_with_quotations": rfq_count or 0,
        },
        "rfq_options": list_rfq_options(db, buyer),
        "quotations": quotations,
    }


# =========================================================
# Suppliers tab
# =========================================================

def _empty_engagement() -> dict:
    return {"quotations": 0, "eligible": 0, "ineligible": 0, "awards": 0, "awarded_value": Decimal("0.00")}


def _engagement_by_supplier(db: Session, buyer: User, supplier_id: int | None = None) -> dict[int, dict]:
    """Quotation, eligibility and award counts per supplier, limited to this buyer's RFQs."""
    quotation_stmt = (
        select(
            Quotation.supplier_id,
            func.count(Quotation.id),
            func.sum(case((Evaluation.overall_status == EvaluationStatus.ELIGIBLE, 1), else_=0)),
            func.sum(case((Evaluation.overall_status == EvaluationStatus.INELIGIBLE, 1), else_=0)),
        )
        .join(RFQ, RFQ.id == Quotation.rfq_id)
        .outerjoin(Evaluation, Evaluation.quotation_id == Quotation.id)
        .where(RFQ.buyer_id == buyer.id)
        .group_by(Quotation.supplier_id)
    )

    award_stmt = (
        select(Quotation.supplier_id, func.count(Award.id), func.sum(Quotation.total_price))
        .select_from(Award)
        .join(Quotation, Quotation.id == Award.quotation_id)
        .join(RFQ, RFQ.id == Award.rfq_id)
        .where(RFQ.buyer_id == buyer.id)
        .group_by(Quotation.supplier_id)
    )

    if supplier_id is not None:
        quotation_stmt = quotation_stmt.where(Quotation.supplier_id == supplier_id)
        award_stmt = award_stmt.where(Quotation.supplier_id == supplier_id)

    engagement = defaultdict(_empty_engagement)

    for sid, total, eligible, ineligible in db.execute(quotation_stmt).all():
        engagement[sid].update(quotations=total, eligible=eligible or 0, ineligible=ineligible or 0)

    for sid, awards, value in db.execute(award_stmt).all():
        engagement[sid].update(awards=awards, awarded_value=Decimal(value or 0).quantize(Decimal("0.01")))

    for data in engagement.values():
        evaluated = data["eligible"] + data["ineligible"]
        data["eligibility_rate"] = round(data["eligible"] * 100 / evaluated, 1) if evaluated else None

    return engagement


def _directory_item(supplier: Supplier, catalogue_items: int, engagement: dict) -> dict:
    return {
        "id": supplier.id,
        "company_name": supplier.company_name,
        "email": supplier.email,
        "phone": supplier.phone,
        "address": supplier.address,
        "joined_at": supplier.created_at,
        "catalogue_items": catalogue_items,
        "engagement": engagement,
    }


def get_supplier_directory(db: Session, buyer: User) -> dict:
    suppliers = db.scalars(select(Supplier).order_by(Supplier.company_name.asc())).all()

    catalogue_counts = dict(
        db.execute(
            select(SupplierCatalogue.supplier_id, func.count(SupplierCatalogue.id))
            .group_by(SupplierCatalogue.supplier_id)
        ).all()
    )

    engagement = _engagement_by_supplier(db, buyer)
    empty = _empty_engagement() | {"eligibility_rate": None}

    items = [
        _directory_item(supplier, catalogue_counts.get(supplier.id, 0), engagement.get(supplier.id, empty))
        for supplier in suppliers
    ]

    return {
        "stats": {
            "total_suppliers": len(items),
            "engaged_suppliers": sum(item["engagement"]["quotations"] > 0 for item in items),
            "suppliers_awarded": sum(item["engagement"]["awards"] > 0 for item in items),
            "catalogue_items": sum(catalogue_counts.values()),
        },
        "suppliers": items,
    }


def get_supplier_profile(db: Session, buyer: User, supplier_id: int) -> dict:
    supplier = db.get(Supplier, supplier_id)

    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    catalogue = db.scalars(
        select(SupplierCatalogue)
        .where(SupplierCatalogue.supplier_id == supplier.id)
        .order_by(SupplierCatalogue.product_name.asc())
    ).all()

    # History only covers this buyer's RFQs; other buyers' dealings stay private.
    history_rows = db.execute(
        select(Quotation, RFQ, Evaluation, Award.id)
        .join(RFQ, RFQ.id == Quotation.rfq_id)
        .outerjoin(Evaluation, Evaluation.quotation_id == Quotation.id)
        .outerjoin(Award, Award.quotation_id == Quotation.id)
        .where(Quotation.supplier_id == supplier.id, RFQ.buyer_id == buyer.id)
        .order_by(Quotation.submitted_at.desc())
    ).all()

    engagement = _engagement_by_supplier(db, buyer, supplier.id).get(
        supplier.id, _empty_engagement() | {"eligibility_rate": None}
    )

    return {
        "supplier": _directory_item(supplier, len(catalogue), engagement),
        "catalogue": [
            {
                "id": item.id,
                "product_name": item.product_name,
                "description": item.description,
                "unit_price": item.unit_price,
                "available_quantity": item.available_quantity,
                "updated_at": item.updated_at or item.created_at,
            }
            for item in catalogue
        ],
        "quotation_history": [
            {
                "quotation_id": quotation.id,
                "quotation_number": quotation.quotation_number,
                "rfq_id": rfq.id,
                "rfq_number": rfq.rfq_number,
                "product_name": rfq.product_name,
                "total_price": quotation.total_price,
                "delivery_days": quotation.delivery_days,
                "warranty_months": quotation.warranty_months,
                "eligibility": _eligibility(evaluation),
                "is_awarded": award_id is not None,
                "submitted_at": quotation.submitted_at,
            }
            for quotation, rfq, evaluation, award_id in history_rows
        ],
    }
