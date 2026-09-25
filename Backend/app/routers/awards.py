from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.award import AwardCreate, AwardDetailResponse, AwardResponse, SupplierAwardResult
from app.security.auth import get_current_user, require_buyer
from app.services.award_service import (
    complete_award,
    create_award,
    get_award_detail,
    get_supplier_award_result,
)


router = APIRouter(
    prefix="/awards",
    tags=["Awards"]
)


@router.post(
    "/{rfq_id}",
    response_model=AwardResponse,
    status_code=status.HTTP_201_CREATED
)
def award_quotation(
    rfq_id: int,
    data: AwardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    return create_award(db, rfq_id, data.quotation_id, current_user)


@router.post(
    "/{rfq_id}/complete",
    response_model=AwardResponse
)
def complete_rfq_award(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    return complete_award(db, rfq_id, current_user)


@router.get(
    "/{rfq_id}/my-result",
    response_model=SupplierAwardResult
)
def my_award_result(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_supplier_award_result(db, rfq_id, current_user)


@router.get(
    "/{rfq_id}",
    response_model=AwardDetailResponse
)
def award_detail(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    return get_award_detail(db, rfq_id, current_user)
