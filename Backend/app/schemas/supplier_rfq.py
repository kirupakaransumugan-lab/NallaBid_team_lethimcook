from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.quotation import QuotationStatus
from app.models.rfq import RFQStatus


class SupplierRFQListItem(BaseModel):
    id: int
    rfq_number: str
    product_name: str
    quantity: int
    max_delivery_days: int
    min_warranty_months: int
    deadline: datetime
    status: RFQStatus
    has_submitted: bool


class SupplierRFQDetail(SupplierRFQListItem):
    description: str | None = None


class SupplierQuotationListItem(BaseModel):
    id: int
    quotation_number: str
    rfq_id: int
    unit_price: Decimal
    total_price: Decimal
    delivery_days: int
    warranty_months: int
    notes: str | None = None
    status: QuotationStatus
    submitted_at: datetime
    updated_at: datetime | None = None
    rfq_number: str
    product_name: str
    rfq_status: RFQStatus
    deadline: datetime
