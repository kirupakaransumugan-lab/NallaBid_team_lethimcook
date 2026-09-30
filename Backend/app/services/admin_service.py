from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, aliased

from app.models.award import ACTIVE_AWARD, Award, AwardStatus
from app.models.company import Company
from app.models.quotation import Quotation
from app.models.rfq import RFQ
from app.models.supplier import Supplier
from app.models.user import User, UserRole
from app.security.auth import is_admin
from app.services.rfq_lifecycle import SEALED_STATUSES, is_sealed


# Read-only views over every buyer and supplier, plus account activation.
# Nothing here edits or deletes RFQs, quotations or awards: that history feeds the reports.

RECENT_LIMIT = 5


# =========================================================
# Row builders
# =========================================================

def _quotation_count():
    return (
        select(func.count(Quotation.id))
        .where(Quotation.rfq_id == RFQ.id)
        .correlate(RFQ)
        .scalar_subquery()
    )


def _rfq_query():
    return select(RFQ, User.full_name, _quotation_count()).join(User, User.id == RFQ.buyer_id)


def _rfq_item(rfq: RFQ, buyer_name: str, quotation_count: int) -> dict:
    return {
        "id": rfq.id,
        "rfq_number": rfq.rfq_number,
        "product_name": rfq.product_name,
        "quantity": rfq.quantity,
        "status": rfq.status.value,
        "deadline": rfq.deadline,
        "created_at": rfq.created_at,
        "buyer_id": rfq.buyer_id,
        "buyer_name": buyer_name,
        "quotation_count": quotation_count or 0,
    }


def _quotation_query():
    return (
        select(Quotation, RFQ, Supplier)
        .join(RFQ, RFQ.id == Quotation.rfq_id)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
    )


def _quotation_item(quotation: Quotation, rfq: RFQ, supplier: Supplier) -> dict:
    # Admins respect sealed bidding too: while the RFQ is DRAFT/OPEN nobody sees the offer.
    sealed = is_sealed(rfq)

    return {
        "id": quotation.id,
        "quotation_number": quotation.quotation_number,
        "rfq_id": rfq.id,
        "rfq_number": rfq.rfq_number,
        "product_name": rfq.product_name,
        "rfq_status": rfq.status.value,
        "supplier_id": supplier.id,
        "supplier_user_id": supplier.user_id,
        "supplier_name": supplier.company_name,
        "sealed": sealed,
        "unit_price": None if sealed else quotation.unit_price,
        "total_price": None if sealed else quotation.total_price,
        "delivery_days": None if sealed else quotation.delivery_days,
        "warranty_months": None if sealed else quotation.warranty_months,
        # The status would reveal the evaluation result, so it is sealed as well.
        "status": None if sealed else quotation.status.value,
        "submitted_at": quotation.submitted_at,
    }


def _award_query():
    buyer = aliased(User)

    return (
        select(Award, RFQ, Quotation, Supplier.company_name, buyer.full_name)
        .join(RFQ, RFQ.id == Award.rfq_id)
        .join(Quotation, Quotation.id == Award.quotation_id)
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .join(buyer, buyer.id == RFQ.buyer_id)
    )


def _award_item(award: Award, rfq: RFQ, quotation: Quotation, supplier_name: str, buyer_name: str) -> dict:
    return {
        "id": award.id,
        "rfq_id": rfq.id,
        "rfq_number": rfq.rfq_number,
        "product_name": rfq.product_name,
        "buyer_name": buyer_name,
        "supplier_name": supplier_name,
        "quotation_number": quotation.quotation_number,
        "total_price": quotation.total_price,
        "status": award.status.value,
        "awarded_at": award.awarded_at,
        "cancelled_at": award.cancelled_at,
        "cancel_reason": award.cancel_reason,
    }


def _user_query():
    rfq_count = (
        select(func.count(RFQ.id)).where(RFQ.buyer_id == User.id).correlate(User).scalar_subquery()
    )
    quotation_count = (
        select(func.count(Quotation.id))
        .join(Supplier, Supplier.id == Quotation.supplier_id)
        .where(Supplier.user_id == User.id)
        .correlate(User)
        .scalar_subquery()
    )

    return (
        select(User, Company.company_name, Supplier.company_name, rfq_count, quotation_count)
        .outerjoin(Company, Company.user_id == User.id)
        .outerjoin(Supplier, Supplier.user_id == User.id)
    )


def _user_item(user: User, buyer_company, supplier_company, rfq_count, quotation_count) -> dict:
    is_supplier = user.role == UserRole.SUPPLIER

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "is_admin": is_admin(user),
        "created_at": user.created_at,
        "company_name": supplier_company if is_supplier else buyer_company,
        "activity_count": (quotation_count if is_supplier else rfq_count) or 0,
    }


# =========================================================
# Dashboard
# =========================================================

def get_overview(db: Session) -> dict:
    role_counts = dict(db.execute(select(User.role, func.count(User.id)).group_by(User.role)).all())
    rfq_counts = {s.value: c for s, c in db.execute(select(RFQ.status, func.count(RFQ.id)).group_by(RFQ.status)).all()}
    award_counts = {s.value: c for s, c in db.execute(select(Award.status, func.count(Award.id)).group_by(Award.status)).all()}

    sealed_quotations = db.scalar(
        select(func.count(Quotation.id)).join(RFQ, RFQ.id == Quotation.rfq_id).where(RFQ.status.in_(SEALED_STATUSES))
    ) or 0

    awarded_value = db.scalar(
        select(func.coalesce(func.sum(Quotation.total_price), 0))
        .join(Award, Award.quotation_id == Quotation.id)
        .where(ACTIVE_AWARD)
    )

    recent_users = db.execute(_user_query().order_by(User.created_at.desc()).limit(RECENT_LIMIT)).all()
    recent_rfqs = db.execute(_rfq_query().order_by(RFQ.created_at.desc()).limit(RECENT_LIMIT)).all()

    return {
        "total_users": sum(role_counts.values()),
        "buyers": role_counts.get(UserRole.BUYER, 0),
        "suppliers": role_counts.get(UserRole.SUPPLIER, 0),
        "inactive_users": db.scalar(select(func.count(User.id)).where(User.is_active.is_(False))) or 0,
        "total_rfqs": sum(rfq_counts.values()),
        "rfqs_by_status": rfq_counts,
        "total_quotations": db.scalar(select(func.count(Quotation.id))) or 0,
        "sealed_quotations": sealed_quotations,
        "active_awards": award_counts.get(AwardStatus.AWARDED.value, 0),
        "completed_awards": award_counts.get(AwardStatus.COMPLETED.value, 0),
        "cancelled_awards": award_counts.get(AwardStatus.CANCELLED.value, 0),
        "awarded_value": awarded_value,
        "recent_users": [_user_item(*row) for row in recent_users],
        "recent_rfqs": [_rfq_item(*row) for row in recent_rfqs],
    }


# =========================================================
# Users
# =========================================================

def list_users(db: Session) -> list[dict]:
    rows = db.execute(_user_query().order_by(User.id.asc())).all()
    return [_user_item(*row) for row in rows]


def _get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


def get_user_detail(db: Session, user_id: int) -> dict:
    user = _get_user(db, user_id)
    row = db.execute(_user_query().where(User.id == user_id)).one()

    detail = {"user": _user_item(*row), "rfqs": [], "quotations": [], "awards": []}

    if user.role == UserRole.SUPPLIER:
        supplier = db.scalar(select(Supplier).where(Supplier.user_id == user.id))

        if supplier is not None:
            detail.update(company_email=supplier.email, phone=supplier.phone, address=supplier.address)

            quotations = db.execute(
                _quotation_query().where(Quotation.supplier_id == supplier.id).order_by(Quotation.submitted_at.desc())
            ).all()
            detail["quotations"] = [_quotation_item(*q) for q in quotations]

            awards = db.execute(
                _award_query().where(Quotation.supplier_id == supplier.id).order_by(Award.awarded_at.desc())
            ).all()
            detail["awards"] = [_award_item(*a) for a in awards]
    else:
        company = db.scalar(select(Company).where(Company.user_id == user.id))

        if company is not None:
            detail.update(company_email=company.company_email, phone=company.phone, address=company.address)

        rfqs = db.execute(_rfq_query().where(RFQ.buyer_id == user.id).order_by(RFQ.created_at.desc())).all()
        detail["rfqs"] = [_rfq_item(*r) for r in rfqs]

        awards = db.execute(_award_query().where(RFQ.buyer_id == user.id).order_by(Award.awarded_at.desc())).all()
        detail["awards"] = [_award_item(*a) for a in awards]

    return detail


def set_user_active(db: Session, user_id: int, is_active: bool, admin: User) -> dict:
    user = _get_user(db, user_id)

    # An admin must never lock the admin panel out, including their own account.
    if user.id == admin.id:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You cannot change your own account status")

    if is_admin(user):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admin accounts cannot be deactivated here")

    # get_current_user rejects inactive users on every request, so this takes effect immediately.
    user.is_active = is_active
    db.commit()

    row = db.execute(_user_query().where(User.id == user_id)).one()
    return _user_item(*row)


# =========================================================
# RFQs, quotations and awards
# =========================================================

def list_rfqs(db: Session) -> list[dict]:
    rows = db.execute(_rfq_query().order_by(RFQ.created_at.desc())).all()
    return [_rfq_item(*row) for row in rows]


def get_rfq_detail(db: Session, rfq_id: int) -> dict:
    row = db.execute(_rfq_query().where(RFQ.id == rfq_id)).first()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="RFQ not found")

    rfq = row[0]
    quotations = db.execute(
        _quotation_query().where(Quotation.rfq_id == rfq.id).order_by(Quotation.total_price.asc())
    ).all()
    awards = db.execute(_award_query().where(Award.rfq_id == rfq.id).order_by(Award.awarded_at.desc())).all()

    return {
        "rfq": _rfq_item(*row),
        "description": rfq.description,
        "max_delivery_days": rfq.max_delivery_days,
        "min_warranty_months": rfq.min_warranty_months,
        "buyer_email": db.scalar(select(User.email).where(User.id == rfq.buyer_id)),
        "quotations": [_quotation_item(*q) for q in quotations],
        "awards": [_award_item(*a) for a in awards],
    }


def list_quotations(db: Session) -> list[dict]:
    rows = db.execute(_quotation_query().order_by(Quotation.submitted_at.desc())).all()
    return [_quotation_item(*row) for row in rows]


def list_awards(db: Session) -> list[dict]:
    rows = db.execute(_award_query().order_by(Award.awarded_at.desc())).all()
    return [_award_item(*row) for row in rows]
