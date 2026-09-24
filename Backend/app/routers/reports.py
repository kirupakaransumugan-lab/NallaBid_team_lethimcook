from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.security.auth import get_current_user
from app.services.report_service import get_award_summary_report, get_rfq_comparison_report, get_supplier_eligibility_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/rfq-comparison")
def rfq_comparison_report(rfq_id: int | None = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_rfq_comparison_report(db, rfq_id)

@router.get("/supplier-eligibility")
def supplier_eligibility_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_supplier_eligibility_report(db)

@router.get("/award-summary")
def award_summary_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_award_summary_report(db)
