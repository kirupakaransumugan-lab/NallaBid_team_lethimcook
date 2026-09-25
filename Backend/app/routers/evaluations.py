from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.evaluation import EvaluationRunResponse, RFQEvaluationOverview
from app.security.auth import require_buyer
from app.services.evaluation_service import get_rfq_evaluation_overview, run_rfq_evaluation


router = APIRouter(
    prefix="/evaluations",
    tags=["Evaluations"]
)


@router.get(
    "/rfq/{rfq_id}",
    response_model=RFQEvaluationOverview
)
def rfq_evaluation_overview(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    return get_rfq_evaluation_overview(db, rfq_id, current_user)


@router.post(
    "/rfq/{rfq_id}/run",
    response_model=EvaluationRunResponse
)
def evaluate_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    return run_rfq_evaluation(db, rfq_id, current_user)
