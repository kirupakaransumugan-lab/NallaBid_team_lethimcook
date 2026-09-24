from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from app.models.quotation import QuotationStatus


class QuotationCreate(BaseModel):
    unit_price: Decimal = Field(gt=0)
    delivery_days: int = Field(gt=0)
    warranty_months: int = Field(ge=0)
    notes: str | None = None


class QuotationUpdate(BaseModel):
    unit_price: Decimal | None = Field(default=None, gt=0)
    delivery_days: int | None = Field(default=None, gt=0)
    warranty_months: int | None = Field(default=None, ge=0)
    notes: str | None = None


class QuotationResponse(BaseModel):
    id: int
    quotation_number: str
    rfq_id: int
    supplier_id: int
    unit_price: Decimal
    total_price: Decimal
    delivery_days: int
    warranty_months: int
    notes: str | None = None
    status: QuotationStatus
    submitted_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
