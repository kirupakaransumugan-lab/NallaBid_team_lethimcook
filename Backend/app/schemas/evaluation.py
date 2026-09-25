from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.award import AwardStatus
from app.models.evaluation import EvaluationStatus
from app.models.quotation import QuotationStatus
from app.schemas.rfq import RFQResponse


class EvaluationResponse(BaseModel):
    id: int
    quotation_id: int
    delivery_pass: bool
    warranty_pass: bool
    quantity_pass: bool
    overall_status: EvaluationStatus
    failure_reason: str | None = None
    evaluated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RFQQuotationItem(BaseModel):
    id: int
    quotation_number: str
    supplier_id: int
    supplier_name: str
    unit_price: Decimal
    total_price: Decimal
    delivery_days: int
    warranty_months: int
    notes: str | None = None
    status: QuotationStatus
    submitted_at: datetime
    evaluation: EvaluationResponse | None = None
    is_awarded: bool = False


class RFQAwardBrief(BaseModel):
    id: int
    quotation_id: int
    status: AwardStatus
    awarded_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RFQEvaluationOverview(BaseModel):
    rfq: RFQResponse
    total_quotations: int
    evaluated_quotations: int
    eligible_quotations: int
    ineligible_quotations: int
    quotations: list[RFQQuotationItem]
    award: RFQAwardBrief | None = None


class EvaluationRunResponse(BaseModel):
    message: str
    rfq_id: int
    evaluated_count: int
    eligible_count: int
    ineligible_count: int
