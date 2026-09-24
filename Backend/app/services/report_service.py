from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.award import Award
from app.models.evaluation import Evaluation
from app.models.quotation import Quotation
from app.models.rfq import RFQ
from app.models.supplier import Supplier

def get_rfq_comparison_report(db: Session, rfq_id: int | None = None):
    stmt = select(RFQ.rfq_number, RFQ.product_name, RFQ.quantity, Supplier.company_name.label("supplier"), Quotation.total_price, Quotation.delivery_days, Quotation.warranty_months, Evaluation.overall_status, Evaluation.failure_reason).join(Quotation, Quotation.rfq_id == RFQ.id).join(Supplier, Supplier.id == Quotation.supplier_id).outerjoin(Evaluation, Evaluation.quotation_id == Quotation.id)
    if rfq_id is not None: stmt = stmt.where(RFQ.id == rfq_id)
    return [{"rfq":r.rfq_number,"product":r.product_name,"quantity":r.quantity,"supplier":r.supplier,"price":r.total_price,"delivery":r.delivery_days,"warranty":r.warranty_months,"eligibility":r.overall_status,"failure_reason":r.failure_reason} for r in db.execute(stmt).all()]

def get_supplier_eligibility_report(db: Session):
    stmt = select(Supplier.id, Supplier.company_name, func.count(Quotation.id).label("total_quotations"), func.sum(func.if_(Evaluation.overall_status == "ELIGIBLE", 1, 0)).label("eligible"), func.sum(func.if_(Evaluation.overall_status == "INELIGIBLE", 1, 0)).label("ineligible")).outerjoin(Quotation, Quotation.supplier_id == Supplier.id).outerjoin(Evaluation, Evaluation.quotation_id == Quotation.id).group_by(Supplier.id, Supplier.company_name)
    return [{"supplier_id":r.id,"supplier":r.company_name,"total_quotations":r.total_quotations,"eligible":r.eligible or 0,"ineligible":r.ineligible or 0} for r in db.execute(stmt).all()]

def get_award_summary_report(db: Session):
    stmt = select(RFQ.rfq_number, Supplier.company_name.label("supplier"), Quotation.total_price, Award.status, Award.awarded_at).join(Award, Award.rfq_id == RFQ.id).join(Quotation, Quotation.id == Award.quotation_id).join(Supplier, Supplier.id == Quotation.supplier_id)
    return [{"rfq":r.rfq_number,"supplier":r.supplier,"award_amount":r.total_price,"status":r.status,"award_date":r.awarded_at} for r in db.execute(stmt).all()]
