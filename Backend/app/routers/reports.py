from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.award import AwardStatus
from app.models.evaluation import EvaluationStatus
from app.models.user import User
from app.schemas.reports import (
    AwardSummaryReport,
    ReportDashboard,
    RFQComparisonReport,
    SupplierEligibilityReport,
)
from app.security.auth import get_current_user
from app.services.report_exports import build_csv, build_pdf
from app.services.reports import (
    AWARD_SUMMARY_COLUMNS,
    RFQ_COMPARISON_COLUMNS,
    SUPPLIER_ELIGIBILITY_COLUMNS,
    award_summary_summary_lines,
    get_award_summary,
    get_dashboard,
    get_rfq_comparison,
    get_supplier_eligibility,
    rfq_comparison_summary_lines,
    supplier_eligibility_summary_lines,
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def _file_response(content: bytes, media_type: str, name: str, extension: str) -> Response:
    filename = f"nallabid-{name}-{datetime.utcnow().strftime('%Y%m%d-%H%M')}.{extension}"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _pdf(report: dict, title: str, name: str, columns, summary_lines) -> Response:
    content = build_pdf(
        title=title,
        filters=report["filters"],
        columns=columns,
        rows=report["rows"],
        summary=summary_lines(report),
        generated_at=report["generated_at"],
    )

    return _file_response(content, "application/pdf", name, "pdf")


def _csv(report: dict, name: str, columns) -> Response:
    return _file_response(build_csv(columns, report["rows"]), "text/csv; charset=utf-8", name, "csv")


def _require_rfq_id(rfq_id: int | None) -> int:
    if rfq_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Select an RFQ (rfq_id) to export the comparison report",
        )

    return rfq_id


# =========================================================
# Dashboard
# =========================================================

@router.get("/dashboard", response_model=ReportDashboard)
def reports_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard(db, current_user)


# =========================================================
# RFQ comparison
# =========================================================

@router.get("/rfq-comparison", response_model=RFQComparisonReport)
def rfq_comparison(
    rfq_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_rfq_comparison(db, current_user, rfq_id)


@router.get("/rfq-comparison/pdf")
def rfq_comparison_pdf(
    rfq_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = get_rfq_comparison(db, current_user, _require_rfq_id(rfq_id))
    return _pdf(report, "RFQ Comparison Report", "rfq-comparison", RFQ_COMPARISON_COLUMNS, rfq_comparison_summary_lines)


@router.get("/rfq-comparison/csv")
def rfq_comparison_csv(
    rfq_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = get_rfq_comparison(db, current_user, _require_rfq_id(rfq_id))
    return _csv(report, "rfq-comparison", RFQ_COMPARISON_COLUMNS)


# =========================================================
# Supplier eligibility
# =========================================================

@router.get("/supplier-eligibility", response_model=SupplierEligibilityReport)
def supplier_eligibility(
    rfq_id: int | None = Query(default=None, gt=0),
    eligibility: EvaluationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_supplier_eligibility(db, current_user, rfq_id, eligibility)


@router.get("/supplier-eligibility/pdf")
def supplier_eligibility_pdf(
    rfq_id: int | None = Query(default=None, gt=0),
    eligibility: EvaluationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = get_supplier_eligibility(db, current_user, rfq_id, eligibility)
    return _pdf(
        report,
        "Supplier Eligibility Report",
        "supplier-eligibility",
        SUPPLIER_ELIGIBILITY_COLUMNS,
        supplier_eligibility_summary_lines,
    )


@router.get("/supplier-eligibility/csv")
def supplier_eligibility_csv(
    rfq_id: int | None = Query(default=None, gt=0),
    eligibility: EvaluationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = get_supplier_eligibility(db, current_user, rfq_id, eligibility)
    return _csv(report, "supplier-eligibility", SUPPLIER_ELIGIBILITY_COLUMNS)


# =========================================================
# Award summary
# =========================================================

@router.get("/award-summary", response_model=AwardSummaryReport)
def award_summary(
    date_from: date | None = None,
    date_to: date | None = None,
    award_status: AwardStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_award_summary(db, current_user, date_from, date_to, award_status)


@router.get("/award-summary/pdf")
def award_summary_pdf(
    date_from: date | None = None,
    date_to: date | None = None,
    award_status: AwardStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = get_award_summary(db, current_user, date_from, date_to, award_status)
    return _pdf(report, "Award Summary Report", "award-summary", AWARD_SUMMARY_COLUMNS, award_summary_summary_lines)


@router.get("/award-summary/csv")
def award_summary_csv(
    date_from: date | None = None,
    date_to: date | None = None,
    award_status: AwardStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = get_award_summary(db, current_user, date_from, date_to, award_status)
    return _csv(report, "award-summary", AWARD_SUMMARY_COLUMNS)
