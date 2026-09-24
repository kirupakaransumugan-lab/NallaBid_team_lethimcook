from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.award import Award
from app.models.evaluation import Evaluation
from app.models.quotation import Quotation
from app.models.rfq import RFQ
from app.models.user import User

from app.schemas.rfq import (
    BuyerDashboardResponse,
    DashboardStats,
    RecentRFQ,
    RFQCreate,
    RFQListItem,
    RFQResponse,
    RFQStatusOverview,
    RFQUpdate,
    QuotationTrendItem,
    UpcomingDeadline,
)

from app.security.auth import get_current_user


router = APIRouter(
    prefix="/rfqs",
    tags=["RFQs"]
)


# =========================================================
# Helper
# =========================================================

def require_buyer(current_user: User):
    if str(current_user.role) != "BUYER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Buyer access required"
        )

    return current_user


# =========================================================
# CREATE RFQ
# =========================================================

@router.post(
    "/",
    response_model=RFQResponse,
    status_code=status.HTTP_201_CREATED
)
def create_rfq(
    data: RFQCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_buyer(current_user)

    if data.deadline <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deadline must be in the future"
        )

    rfq_number = generate_rfq_number(db)

    rfq = RFQ(
        rfq_number=rfq_number,
        buyer_id=current_user.id,
        product_name=data.product_name,
        description=data.description,
        quantity=data.quantity,
        max_delivery_days=data.max_delivery_days,
        min_warranty_months=data.min_warranty_months,
        deadline=data.deadline,
        status="DRAFT"
    )

    db.add(rfq)
    db.commit()
    db.refresh(rfq)

    return rfq


# =========================================================
# GET MY RFQs
# =========================================================

@router.get(
    "/",
    response_model=list[RFQListItem]
)
def get_my_rfqs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_buyer(current_user)

    rows = (
        db.query(
            RFQ.id,
            RFQ.rfq_number,
            RFQ.product_name,
            RFQ.quantity,
            RFQ.deadline,
            RFQ.status,
            func.count(Quotation.id).label(
                "quotation_count"
            )
        )
        .outerjoin(
            Quotation,
            Quotation.rfq_id == RFQ.id
        )
        .filter(
            RFQ.buyer_id == current_user.id
        )
        .group_by(
            RFQ.id,
            RFQ.rfq_number,
            RFQ.product_name,
            RFQ.quantity,
            RFQ.deadline,
            RFQ.status
        )
        .order_by(
            RFQ.created_at.desc()
        )
        .all()
    )

    return [
        RFQListItem(
            id=row.id,
            rfq_number=row.rfq_number,
            product_name=row.product_name,
            quantity=row.quantity,
            deadline=row.deadline,
            status=str(row.status),
            quotation_count=row.quotation_count
        )
        for row in rows
    ]


# =========================================================
# GET SINGLE RFQ
# =========================================================

@router.get(
    "/{rfq_id}",
    response_model=RFQResponse
)
def get_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_buyer(current_user)

    rfq = (
        db.query(RFQ)
        .filter(
            RFQ.id == rfq_id,
            RFQ.buyer_id == current_user.id
        )
        .first()
    )

    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found"
        )

    return rfq


# =========================================================
# UPDATE RFQ
# =========================================================

@router.put(
    "/{rfq_id}",
    response_model=RFQResponse
)
def update_rfq(
    rfq_id: int,
    data: RFQUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_buyer(current_user)

    rfq = (
        db.query(RFQ)
        .filter(
            RFQ.id == rfq_id,
            RFQ.buyer_id == current_user.id
        )
        .first()
    )

    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found"
        )

    if rfq.status not in ["DRAFT", "OPEN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This RFQ cannot be edited"
        )

    if data.deadline is not None:
        if data.deadline <= datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Deadline must be in the future"
            )

        rfq.deadline = data.deadline

    if data.product_name is not None:
        rfq.product_name = data.product_name

    if data.description is not None:
        rfq.description = data.description

    if data.quantity is not None:
        rfq.quantity = data.quantity

    if data.max_delivery_days is not None:
        rfq.max_delivery_days = data.max_delivery_days

    if data.min_warranty_months is not None:
        rfq.min_warranty_months = data.min_warranty_months

    rfq.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rfq)

    return rfq


# =========================================================
# PUBLISH RFQ
# =========================================================

@router.post(
    "/{rfq_id}/publish",
    response_model=RFQResponse
)
def publish_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_buyer(current_user)

    rfq = (
        db.query(RFQ)
        .filter(
            RFQ.id == rfq_id,
            RFQ.buyer_id == current_user.id
        )
        .first()
    )

    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found"
        )

    if rfq.status != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft RFQs can be published"
        )

    if rfq.deadline <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot publish an expired RFQ"
        )

    rfq.status = "OPEN"
    rfq.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rfq)

    return rfq


# =========================================================
# CLOSE RFQ
# =========================================================

@router.post(
    "/{rfq_id}/close",
    response_model=RFQResponse
)
def close_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_buyer(current_user)

    rfq = (
        db.query(RFQ)
        .filter(
            RFQ.id == rfq_id,
            RFQ.buyer_id == current_user.id
        )
        .first()
    )

    if not rfq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFQ not found"
        )

    if rfq.status != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only open RFQs can be closed"
        )

    rfq.status = "CLOSED"
    rfq.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(rfq)

    return rfq


# =========================================================
# BUYER DASHBOARD
# =========================================================

@router.get(
    "/dashboard",
    response_model=BuyerDashboardResponse
)
def get_buyer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_buyer(current_user)

    # -----------------------------------------------------
    # Total RFQs
    # -----------------------------------------------------

    total_rfqs = (
        db.query(func.count(RFQ.id))
        .filter(
            RFQ.buyer_id == current_user.id
        )
        .scalar()
        or 0
    )

    # -----------------------------------------------------
    # Quotations received
    # -----------------------------------------------------

    quotations_received = (
        db.query(func.count(Quotation.id))
        .join(
            RFQ,
            Quotation.rfq_id == RFQ.id
        )
        .filter(
            RFQ.buyer_id == current_user.id
        )
        .scalar()
        or 0
    )

    # -----------------------------------------------------
    # Pending evaluation
    # -----------------------------------------------------

    pending_evaluation = (
        db.query(func.count(Quotation.id))
        .join(
            RFQ,
            Quotation.rfq_id == RFQ.id
        )
        .outerjoin(
            Evaluation,
            Evaluation.quotation_id == Quotation.id
        )
        .filter(
            RFQ.buyer_id == current_user.id,
            Evaluation.id.is_(None)
        )
        .scalar()
        or 0
    )

    # -----------------------------------------------------
    # Awarded RFQs
    # -----------------------------------------------------

    awarded = (
        db.query(func.count(Award.id))
        .join(
            RFQ,
            Award.rfq_id == RFQ.id
        )
        .filter(
            RFQ.buyer_id == current_user.id
        )
        .scalar()
        or 0
    )

    stats = DashboardStats(
        total_rfqs=total_rfqs,
        quotations_received=quotations_received,
        pending_evaluation=pending_evaluation,
        awarded=awarded
    )

    # -----------------------------------------------------
    # Recent RFQs
    # -----------------------------------------------------

    recent_rows = (
        db.query(
            RFQ.id,
            RFQ.rfq_number,
            RFQ.product_name,
            RFQ.deadline,
            RFQ.status,
            func.count(
                Quotation.id
            ).label("quotation_count")
        )
        .outerjoin(
            Quotation,
            Quotation.rfq_id == RFQ.id
        )
        .filter(
            RFQ.buyer_id == current_user.id
        )
        .group_by(
            RFQ.id,
            RFQ.rfq_number,
            RFQ.product_name,
            RFQ.deadline,
            RFQ.status
        )
        .order_by(
            RFQ.created_at.desc()
        )
        .limit(5)
        .all()
    )

    recent_rfqs = [
        RecentRFQ(
            id=row.id,
            rfq_number=row.rfq_number,
            product_name=row.product_name,
            deadline=row.deadline,
            quotation_count=row.quotation_count,
            status=str(row.status)
        )
        for row in recent_rows
    ]

    # -----------------------------------------------------
    # Status overview
    # -----------------------------------------------------

    status_rows = (
        db.query(
            RFQ.status,
            func.count(RFQ.id).label("count")
        )
        .filter(
            RFQ.buyer_id == current_user.id
        )
        .group_by(
            RFQ.status
        )
        .all()
    )

    status_counts = {
        "DRAFT": 0,
        "OPEN": 0,
        "CLOSED": 0,
        "AWARDED": 0
    }

    for row in status_rows:
        status_name = str(row.status)

        if status_name in status_counts:
            status_counts[status_name] = row.count

    status_overview = RFQStatusOverview(
        draft=status_counts["DRAFT"],
        open=status_counts["OPEN"],
        closed=status_counts["CLOSED"],
        awarded=status_counts["AWARDED"]
    )

    # -----------------------------------------------------
    # Upcoming deadlines
    # -----------------------------------------------------

    now = datetime.utcnow()

    upcoming_rows = (
        db.query(RFQ)
        .filter(
            RFQ.buyer_id == current_user.id,
            RFQ.deadline >= now
        )
        .order_by(
            RFQ.deadline.asc()
        )
        .limit(5)
        .all()
    )

    upcoming_deadlines = []

    for rfq in upcoming_rows:
        days_left = max(
            0,
            (rfq.deadline.date() - now.date()).days
        )

        upcoming_deadlines.append(
            UpcomingDeadline(
                id=rfq.id,
                rfq_number=rfq.rfq_number,
                product_name=rfq.product_name,
                deadline=rfq.deadline,
                days_left=days_left,
                status=str(rfq.status)
            )
        )

    # -----------------------------------------------------
    # Quotation trend
    # -----------------------------------------------------

    quotation_rows = (
        db.query(
            func.date_format(
                Quotation.submitted_at,
                "%Y-%m"
            ).label("month"),
            func.count(
                Quotation.id
            ).label("quotation_count")
        )
        .join(
            RFQ,
            Quotation.rfq_id == RFQ.id
        )
        .filter(
            RFQ.buyer_id == current_user.id
        )
        .group_by(
            func.date_format(
                Quotation.submitted_at,
                "%Y-%m"
            )
        )
        .order_by(
            func.date_format(
                Quotation.submitted_at,
                "%Y-%m"
            )
        )
        .limit(6)
        .all()
    )

    quotation_trend = [
        QuotationTrendItem(
            month=row.month,
            quotation_count=row.quotation_count
        )
        for row in quotation_rows
    ]

    return BuyerDashboardResponse(
        stats=stats,
        recent_rfqs=recent_rfqs,
        status_overview=status_overview,
        upcoming_deadlines=upcoming_deadlines,
        quotation_trend=quotation_trend
    )


# =========================================================
# RFQ NUMBER GENERATOR
# =========================================================

def generate_rfq_number(db: Session):
    year = datetime.utcnow().year

    last_rfq = (
        db.query(RFQ)
        .filter(
            RFQ.rfq_number.like(
                f"RFQ-{year}-%"
            )
        )
        .order_by(
            RFQ.id.desc()
        )
        .first()
    )

    if last_rfq:
        try:
            last_number = int(
                last_rfq.rfq_number.split("-")[-1]
            )
        except ValueError:
            last_number = 0
    else:
        last_number = 0

    next_number = last_number + 1

    return f"RFQ-{year}-{next_number:04d}"