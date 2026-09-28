from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.award import AwardStatus
from app.models.quotation import QuotationStatus


class AwardCreate(BaseModel):
    quotation_id: int = Field(gt=0)

    # Reject awarded_by, buyer_id, status, prices... with 422 instead of silently
    # ignoring them; the backend derives all of those itself.
    model_config = ConfigDict(extra="forbid")


class AwardCancel(BaseModel):
    # Required so the history always says why an award was undone.
    reason: str = Field(min_length=5, max_length=500)

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class CancelledAwardItem(BaseModel):
    award_id: int
    quotation_id: int
    quotation_number: str
    supplier_name: str
    awarded_at: datetime
    cancelled_at: datetime | None = None
    cancelled_by_name: str | None = None
    cancel_reason: str | None = None


class AwardResponse(BaseModel):
    id: int
    rfq_id: int
    quotation_id: int
    awarded_by: int
    awarded_at: datetime
    status: AwardStatus
    cancelled_at: datetime | None = None
    cancel_reason: str | None = None
    model_config = ConfigDict(from_attributes=True)


class AwardDetailResponse(BaseModel):
    """Buyer view of an award, with everything the Award Result page shows."""

    id: int
    status: AwardStatus
    awarded_at: datetime
    awarded_by: int
    awarded_by_name: str

    rfq_id: int
    rfq_number: str
    product_name: str
    quantity: int
    rfq_status: str
    max_delivery_days: int
    min_warranty_months: int

    quotation_id: int
    quotation_number: str
    unit_price: Decimal
    awarded_amount: Decimal
    delivery_days: int
    warranty_months: int

    supplier_id: int
    supplier_name: str
    supplier_email: str | None = None
    supplier_phone: str | None = None


class SupplierAwardResult(BaseModel):
    """Supplier view: only their own quotation, never the winner's details."""

    rfq_id: int
    rfq_number: str
    product_name: str
    quantity: int
    rfq_status: str

    quotation_id: int
    quotation_number: str
    unit_price: Decimal
    total_price: Decimal
    delivery_days: int
    warranty_months: int
    quotation_status: QuotationStatus

    outcome: Literal["AWARDED", "NOT_AWARDED", "PENDING"]
    award_status: AwardStatus | None = None
    awarded_at: datetime | None = None
