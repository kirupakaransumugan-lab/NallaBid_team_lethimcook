from collections import defaultdict
from datetime import date, datetime, time, timedelta
from decimal import ROUND_HALF_UP, Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.award import Award, AwardStatus
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.quotation import Quotation
from app.models.rfq import RFQ, RFQStatus
from app.models.supplier import Supplier
from app.models.user import User
from app.services.evaluation_service import (
    find_available_quantity,
    get_owned_rfq,
    get_rfq_evaluation_overview,
)


MONEY = Decimal("0.01")
MONTHS_IN_TREND = 12


# =========================================================
# Helpers
# =========================================================

def _money(value) -> Decimal:
    return Decimal(value or 0).quantize(MONEY, rounding=ROUND_HALF_UP)


def _require_buyer(user: User) -> None:
    if user.role != "BUYER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Buyer access required")


def _get_supplier(db: Session, user: User) -> Supplier:
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == user.id))

    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier profile not found")

    return supplier


def _scope(stmt, db: Session, user: User):
    """Restrict a statement that joins RFQ and Quotation to rows the user may see.

    Buyers see quotations on their own RFQs; suppliers see only their own quotations.
    """
    if user.role == "BUYER":
        return stmt.where(RFQ.buyer_id == user.id)

    if user.role == "SUPPLIER":
        return stmt.where(Quotation.supplier_id == _get_supplier(db, user).id)

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to view reports")


def _scope_label(user: User) -> str:
    return "Your RFQs" if user.role == "BUYER" else "Your quotations"


def _trend_months() -> list[str]:
    """Month keys (YYYY-MM) for the last MONTHS_IN_TREND months, oldest first."""
    year, month = date.today().year, date.today().month
    keys = []

    for _ in range(MONTHS_IN_TREND):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1

        if month == 0:
            month, year = 12, year - 1

    return list(reversed(keys))


def _month_label(key: str) -> str:
    return datetime.strptime(key, "%Y-%m").strftime("%b %Y")


def _monthly_counts(db: Session, date_column, count_column, stmt_filter) -> list[dict]:
    months = _trend_months()
    start = datetime.strptime(months[0], "%Y-%m")
    month_expr = func.date_format(date_column, "%Y-%m")

    rows = db.execute(
        stmt_filter(select(month_expr.label("month"), func.count(count_column).label("total")))
        .where(date_column >= start)
        .group_by(month_expr)
    ).all()

    counts = {row.month: row.total for row in rows}

    return [{"label": _month_label(key), "value": counts.get(key, 0)} for key in months]


def list_rfq_options(db: Session, user: User) -> list[dict]:
    stmt = (
        select(
            RFQ.id,
            RFQ.rfq_number,
            RFQ.product_name,
            RFQ.status,
            func.count(Quotation.id).label("quotation_count"),
        )
        .outerjoin(Quotation, Quotation.rfq_id == RFQ.id)
        .group_by(RFQ.id, RFQ.rfq_number, RFQ.product_name, RFQ.status, RFQ.created_at)
        .order_by(RFQ.created_at.desc())
    )

    return [
        {
            "id": row.id,
            "rfq_number": row.rfq_number,
            "product_name": row.product_name,
            "status": row.status.value,
            "quotation_count": row.quotation_count,
        }
        for row in db.execute(_scope(stmt, db, user)).all()
    ]


def _awards_by_supplier(rows) -> list[dict]:
    totals = defaultdict(lambda: {"award_count": 0, "total_value": Decimal("0")})

    for supplier_name, amount in rows:
        totals[supplier_name]["award_count"] += 1
        totals[supplier_name]["total_value"] += Decimal(amount)

    return sorted(
        (
            {"supplier_name": name, "award_count": data["award_count"], "total_value": _money(data["total_value"])}
            for name, data in totals.items()
        ),
        key=lambda item: item["total_value"],
        reverse=True,
    )


# =========================================================
# Dashboard
# =========================================================

def get_dashboard(db: Session, user: User) -> dict:
    _require_buyer(user)

    def own_rfqs(stmt):
        return stmt.where(RFQ.buyer_id == user.id)

    status_rows = db.execute(
        own_rfqs(select(RFQ.status, func.count(RFQ.id))).group_by(RFQ.status)
    ).all()

    rfq_counts = {rfq_status.value: 0 for rfq_status in RFQStatus}

    for rfq_status, count in status_rows:
        rfq_counts[rfq_status.value] = count

    eligibility_rows = db.execute(
        own_rfqs(
            select(Evaluation.overall_status, func.count(Quotation.id))
            .select_from(Quotation)
            .join(RFQ, RFQ.id == Quotation.rfq_id)
            .outerjoin(Evaluation, Evaluation.quotation_id == Quotation.id)
        ).group_by(Evaluation.overall_status)
    ).all()

    eligibility = {"ELIGIBLE": 0, "INELIGIBLE": 0, "PENDING": 0}

    for overall_status, count in eligibility_rows:
        eligibility[overall_status.value if overall_status else "PENDING"] = count

    award_rows = db.execute(
        own_rfqs(
            select(Supplier.company_name, Quotation.total_price)
            .select_from(Award)
            .join(RFQ, RFQ.id == Award.rfq_id)
            .join(Quotation, Quotation.id == Award.quotation_id)
            .join(Supplier, Supplier.id == Quotation.supplier_id)
        )
    ).all()

    total_awarded_value = sum((Decimal(amount) for _, amount in award_rows), Decimal("0"))

    return {
        "total_rfqs": sum(rfq_counts.values()),
        "draft_rfqs": rfq_counts["DRAFT"],
        "open_rfqs": rfq_counts["OPEN"],
        "closed_rfqs": rfq_counts["CLOSED"],
        "awarded_rfqs": rfq_counts["AWARDED"],
        "completed_rfqs": rfq_counts["COMPLETED"],
        "total_quotations": sum(eligibility.values()),
        "eligible_quotations": eligibility["ELIGIBLE"],
        "ineligible_quotations": eligibility["INELIGIBLE"],
        "pending_quotations": eligibility["PENDING"],
        "total_awards": len(award_rows),
        "total_awarded_value": _money(total_awarded_value),
        "rfq_status_distribution": [
            {"label": name.title(), "value": count} for name, count in rfq_counts.items()
        ],
        "monthly_rfq_count": _monthly_counts(db, RFQ.created_at, RFQ.id, own_rfqs),
        "monthly_quotation_count": _monthly_counts(
            db,
            Quotation.submitted_at,
            Quotation.id,
            lambda stmt: own_rfqs(stmt.select_from(Quotation).join(RFQ, RFQ.id == Quotation.rfq_id)),
        ),
        "eligibility_distribution": [
            {"label": name.title(), "value": count} for name, count in eligibility.items()
        ],
        "awards_by_supplier": _awards_by_supplier(award_rows),
    }


# =========================================================
# Report 1 - RFQ comparison (buyer only)
# =========================================================

def get_rfq_comparison(db: Session, user: User, rfq_id: int | None) -> dict:
    _require_buyer(user)

    report = {
        "generated_at": datetime.utcnow(),
        "filters": {"Scope": _scope_label(user), "RFQ": "Not selected"},
        "rfq_options": list_rfq_options(db, user),
        "rfq": None,
        "rows": [],
        "summary": None,
    }

    if rfq_id is None:
        return report

    overview = get_rfq_evaluation_overview(db, rfq_id, user)
    rfq = overview["rfq"]
    rows = []

    for item in overview["quotations"]:
        evaluation = item["evaluation"]

        if evaluation is None:
            eligibility, result = "PENDING", "Not evaluated yet"
        elif evaluation.overall_status == EvaluationStatus.ELIGIBLE:
            eligibility, result = "ELIGIBLE", "Meets all requirements"
        else:
            eligibility, result = "INELIGIBLE", evaluation.failure_reason or "Did not meet requirements"

        rows.append({
            "rfq_number": rfq.rfq_number,
            "product_name": rfq.product_name,
            "quotation_id": item["id"],
            "quotation_number": item["quotation_number"],
            "supplier_name": item["supplier_name"],
            "unit_price": item["unit_price"],
            "total_price": item["total_price"],
            "delivery_days": item["delivery_days"],
            "warranty_months": item["warranty_months"],
            "quotation_status": item["status"].value,
            "eligibility": eligibility,
            "evaluation_result": result,
        })

    prices = [Decimal(row["total_price"]) for row in rows]

    report["filters"]["RFQ"] = f"{rfq.rfq_number} - {rfq.product_name}"
    report["rfq"] = {
        "id": rfq.id,
        "rfq_number": rfq.rfq_number,
        "product_name": rfq.product_name,
        "quantity": rfq.quantity,
        "max_delivery_days": rfq.max_delivery_days,
        "min_warranty_months": rfq.min_warranty_months,
        "status": rfq.status.value,
    }
    report["rows"] = rows
    report["summary"] = {
        "quotation_count": len(rows),
        "lowest_price": min(prices) if prices else None,
        "highest_price": max(prices) if prices else None,
        "average_price": _money(sum(prices) / len(prices)) if prices else None,
        "fastest_delivery_days": min((row["delivery_days"] for row in rows), default=None),
        "highest_warranty_months": max((row["warranty_months"] for row in rows), default=None),
        "eligible_count": sum(row["eligibility"] == "ELIGIBLE" for row in rows),
        "ineligible_count": sum(row["eligibility"] == "INELIGIBLE" for row in rows),
        "pending_count": sum(row["eligibility"] == "PENDING" for row in rows),
    }

    return report


# =========================================================
# Report 2 - Supplier eligibility (buyer: own RFQs, supplier: own quotations)
# =========================================================

FAILURE_LABELS = {
    "delivery_pass": "Delivery requirement not met",
    "warranty_pass": "Warranty requirement not met",
    "quantity_pass": "Insufficient available quantity",
}


def get_supplier_eligibility(
    db: Session,
    user: User,
    rfq_id: int | None,
    eligibility: EvaluationStatus | None,
) -> dict:
    stmt = (
        select(Quotation, RFQ, Supplier.company_name, Evaluation)
        .join(RFQ, RFQ.id == Quotation.rfq_id)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .join(Evaluation, Evaluation.quotation_id == Quotation.id)
        .order_by(RFQ.created_at.desc(), Supplier.company_name.asc())
    )
    stmt = _scope(stmt, db, user)

    filters = {"Scope": _scope_label(user), "RFQ": "All RFQs", "Eligibility": "All"}

    if rfq_id is not None:
        if user.role == "BUYER":
            rfq = get_owned_rfq(db, rfq_id, user)
            filters["RFQ"] = f"{rfq.rfq_number} - {rfq.product_name}"
        else:
            filters["RFQ"] = f"RFQ #{rfq_id}"

        stmt = stmt.where(RFQ.id == rfq_id)

    if eligibility is not None:
        stmt = stmt.where(Evaluation.overall_status == eligibility)
        filters["Eligibility"] = eligibility.value.title()

    available_cache = {}
    failure_counts = {label: 0 for label in FAILURE_LABELS.values()}
    rows = []

    for quotation, rfq, supplier_name, evaluation in db.execute(stmt).all():
        cache_key = (quotation.supplier_id, rfq.product_name)

        if cache_key not in available_cache:
            available_cache[cache_key] = find_available_quantity(db, quotation.supplier_id, rfq.product_name)

        for flag, label in FAILURE_LABELS.items():
            if not getattr(evaluation, flag):
                failure_counts[label] += 1

        rows.append({
            "supplier_name": supplier_name,
            "rfq_number": rfq.rfq_number,
            "quotation_number": quotation.quotation_number,
            "product_name": rfq.product_name,
            "requested_quantity": rfq.quantity,
            "available_quantity": available_cache[cache_key],
            "quoted_price": quotation.total_price,
            "delivery_requirement": rfq.max_delivery_days,
            "actual_delivery": quotation.delivery_days,
            "warranty_requirement": rfq.min_warranty_months,
            "actual_warranty": quotation.warranty_months,
            "eligibility": evaluation.overall_status.value,
            "failure_reason": evaluation.failure_reason,
            "evaluated_at": evaluation.evaluated_at,
        })

    eligible = sum(row["eligibility"] == "ELIGIBLE" for row in rows)

    return {
        "generated_at": datetime.utcnow(),
        "filters": filters,
        "rfq_options": list_rfq_options(db, user),
        "rows": rows,
        "summary": {
            "total_quotations": len(rows),
            "eligible_quotations": eligible,
            "ineligible_quotations": len(rows) - eligible,
            "eligibility_percentage": round(eligible * 100 / len(rows), 1) if rows else 0.0,
            "failure_reason_counts": [
                {"reason": reason, "count": count} for reason, count in failure_counts.items()
            ],
        },
    }


# =========================================================
# Report 3 - Award summary (buyer: own RFQs, supplier: own awards)
# =========================================================

def get_award_summary(
    db: Session,
    user: User,
    date_from: date | None,
    date_to: date | None,
    award_status: AwardStatus | None,
) -> dict:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="date_from must be on or before date_to",
        )

    stmt = (
        select(Award, RFQ, Quotation, Supplier.company_name, User.full_name)
        .join(RFQ, RFQ.id == Award.rfq_id)
        .join(Quotation, Quotation.id == Award.quotation_id)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .join(User, User.id == Award.awarded_by)
        .order_by(Award.awarded_at.desc())
    )
    stmt = _scope(stmt, db, user)

    filters = {"Scope": _scope_label(user), "From": "Any", "To": "Any", "Status": "All"}

    if date_from:
        stmt = stmt.where(Award.awarded_at >= datetime.combine(date_from, time.min))
        filters["From"] = date_from.isoformat()

    if date_to:
        stmt = stmt.where(Award.awarded_at < datetime.combine(date_to + timedelta(days=1), time.min))
        filters["To"] = date_to.isoformat()

    if award_status:
        stmt = stmt.where(Award.status == award_status)
        filters["Status"] = award_status.value.title()

    rows = []
    monthly = defaultdict(lambda: {"award_count": 0, "total_value": Decimal("0")})

    for award, rfq, quotation, supplier_name, awarded_by_name in db.execute(stmt).all():
        rows.append({
            "award_id": award.id,
            "rfq_id": rfq.id,
            "rfq_number": rfq.rfq_number,
            "product_name": rfq.product_name,
            "supplier_name": supplier_name,
            "quotation_number": quotation.quotation_number,
            "awarded_amount": quotation.total_price,
            "delivery_days": quotation.delivery_days,
            "warranty_months": quotation.warranty_months,
            "awarded_at": award.awarded_at,
            "awarded_by_name": awarded_by_name,
            "status": award.status.value,
        })

        month = monthly[award.awarded_at.strftime("%Y-%m")]
        month["award_count"] += 1
        month["total_value"] += Decimal(quotation.total_price)

    total_value = sum((Decimal(row["awarded_amount"]) for row in rows), Decimal("0"))

    return {
        "generated_at": datetime.utcnow(),
        "filters": filters,
        "rows": rows,
        "summary": {
            "total_awards": len(rows),
            "total_awarded_value": _money(total_value),
            "average_award_value": _money(total_value / len(rows)) if rows else _money(0),
            "awards_by_supplier": _awards_by_supplier(
                (row["supplier_name"], row["awarded_amount"]) for row in rows
            ),
            "awards_by_month": [
                {"month": _month_label(key), "award_count": data["award_count"], "total_value": _money(data["total_value"])}
                for key, data in sorted(monthly.items())
            ],
        },
    }


# =========================================================
# Export layouts (shared by CSV and PDF)
# =========================================================

RFQ_COMPARISON_COLUMNS = [
    ("rfq_number", "RFQ"),
    ("supplier_name", "Supplier"),
    ("quotation_number", "Quotation"),
    ("unit_price", "Unit Price (LKR)"),
    ("total_price", "Total Price (LKR)"),
    ("delivery_days", "Delivery (days)"),
    ("warranty_months", "Warranty (months)"),
    ("eligibility", "Eligibility"),
    ("evaluation_result", "Evaluation Result"),
]

SUPPLIER_ELIGIBILITY_COLUMNS = [
    ("supplier_name", "Supplier"),
    ("rfq_number", "RFQ"),
    ("quotation_number", "Quotation"),
    ("product_name", "Product"),
    ("requested_quantity", "Requested Qty"),
    ("available_quantity", "Available Qty"),
    ("quoted_price", "Quoted Price (LKR)"),
    ("delivery_requirement", "Max Delivery (days)"),
    ("actual_delivery", "Actual Delivery (days)"),
    ("warranty_requirement", "Min Warranty (months)"),
    ("actual_warranty", "Actual Warranty (months)"),
    ("eligibility", "Eligibility"),
    ("failure_reason", "Failure Reason"),
]

AWARD_SUMMARY_COLUMNS = [
    ("rfq_number", "RFQ"),
    ("product_name", "Product"),
    ("supplier_name", "Supplier"),
    ("quotation_number", "Quotation"),
    ("awarded_amount", "Awarded Amount (LKR)"),
    ("delivery_days", "Delivery (days)"),
    ("warranty_months", "Warranty (months)"),
    ("awarded_at", "Award Date"),
    ("awarded_by_name", "Awarded By"),
    ("status", "Status"),
]


def rfq_comparison_summary_lines(report: dict) -> list[tuple[str, object]]:
    summary = report["summary"]

    if summary is None:
        return []

    return [
        ("Quotations", summary["quotation_count"]),
        ("Lowest price (LKR)", summary["lowest_price"]),
        ("Highest price (LKR)", summary["highest_price"]),
        ("Average price (LKR)", summary["average_price"]),
        ("Fastest delivery (days)", summary["fastest_delivery_days"]),
        ("Highest warranty (months)", summary["highest_warranty_months"]),
        ("Eligible", summary["eligible_count"]),
        ("Ineligible", summary["ineligible_count"]),
        ("Not evaluated", summary["pending_count"]),
    ]


def supplier_eligibility_summary_lines(report: dict) -> list[tuple[str, object]]:
    summary = report["summary"]
    lines = [
        ("Evaluated quotations", summary["total_quotations"]),
        ("Eligible", summary["eligible_quotations"]),
        ("Ineligible", summary["ineligible_quotations"]),
        ("Eligibility rate", f"{summary['eligibility_percentage']}%"),
    ]

    return lines + [(item["reason"], item["count"]) for item in summary["failure_reason_counts"]]


def award_summary_summary_lines(report: dict) -> list[tuple[str, object]]:
    summary = report["summary"]
    lines = [
        ("Total awards", summary["total_awards"]),
        ("Total awarded value (LKR)", summary["total_awarded_value"]),
        ("Average award value (LKR)", summary["average_award_value"]),
    ]

    return lines + [
        (f"{item['supplier_name']} ({item['award_count']} awards, LKR)", item["total_value"])
        for item in summary["awards_by_supplier"]
    ]
