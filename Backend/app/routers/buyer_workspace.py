from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.quotation import QuotationStatus
from app.models.user import User
from app.schemas.buyer_workspace import (
    ReceivedQuotationsResponse,
    SupplierDirectoryResponse,
    SupplierProfileResponse,
)
from app.security.auth import require_buyer
from app.services.buyer_workspace_service import (
    get_received_quotations,
    get_supplier_directory,
    get_supplier_profile,
)


# Under /buyer because /api/quotations/{quotation_id} (supplier router) would
# otherwise capture paths like /api/quotations/received.
router = APIRouter(
    prefix="/buyer",
    tags=["Buyer Workspace"]
)


@router.get(
    "/quotations",
    response_model=ReceivedQuotationsResponse
)
def received_quotations(
    rfq_id: int | None = Query(default=None, gt=0),
    status: QuotationStatus | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    return get_received_quotations(db, current_user, rfq_id, status)


@router.get(
    "/suppliers",
    response_model=SupplierDirectoryResponse
)
def supplier_directory(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    return get_supplier_directory(db, current_user)


@router.get(
    "/suppliers/{supplier_id}",
    response_model=SupplierProfileResponse
)
def supplier_profile(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    return get_supplier_profile(db, current_user, supplier_id)
