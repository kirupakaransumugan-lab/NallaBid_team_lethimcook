from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminAwardItem,
    AdminOverview,
    AdminQuotationItem,
    AdminRFQDetail,
    AdminRFQItem,
    AdminStatusUpdate,
    AdminUserDetail,
    AdminUserItem,
)
from app.security.auth import require_admin
from app.services import admin_service


# Every route requires an email listed in ADMIN_EMAILS (see config.py).
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)]
)


@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db)):
    return admin_service.get_overview(db)


@router.get("/users", response_model=list[AdminUserItem])
def users(db: Session = Depends(get_db)):
    return admin_service.list_users(db)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def user_detail(user_id: int, db: Session = Depends(get_db)):
    return admin_service.get_user_detail(db, user_id)


@router.patch("/users/{user_id}/status", response_model=AdminUserItem)
def update_user_status(
    user_id: int,
    data: AdminStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return admin_service.set_user_active(db, user_id, data.is_active, admin)


@router.get("/rfqs", response_model=list[AdminRFQItem])
def rfqs(db: Session = Depends(get_db)):
    return admin_service.list_rfqs(db)


@router.get("/rfqs/{rfq_id}", response_model=AdminRFQDetail)
def rfq_detail(rfq_id: int, db: Session = Depends(get_db)):
    return admin_service.get_rfq_detail(db, rfq_id)


@router.get("/quotations", response_model=list[AdminQuotationItem])
def quotations(db: Session = Depends(get_db)):
    return admin_service.list_quotations(db)


@router.get("/awards", response_model=list[AdminAwardItem])
def awards(db: Session = Depends(get_db)):
    return admin_service.list_awards(db)
