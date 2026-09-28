from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel

from app.schemas.reports import RFQOption


Eligibility = Literal["ELIGIBLE", "INELIGIBLE", "PENDING"]


# =========================================================
# Quotations tab
# =========================================================

class ReceivedQuotation(BaseModel):
    id: int
    quotation_number: str
    rfq_id: int
    rfq_number: str
    product_name: str
    rfq_status: str
    supplier_id: int
    supplier_name: str
    unit_price: Decimal
    total_price: Decimal
    delivery_days: int
    warranty_months: int
    notes: str | None = None
    status: str
    eligibility: Eligibility
    failure_reason: str | None = None
    submitted_at: datetime
    is_awarded: bool


class ReceivedQuotationStats(BaseModel):
    total: int
    pending_evaluation: int
    eligible: int
    ineligible: int
    awarded: int
    rfqs_with_quotations: int


class ReceivedQuotationsResponse(BaseModel):
    stats: ReceivedQuotationStats
    rfq_options: list[RFQOption]
    quotations: list[ReceivedQuotation]


# =========================================================
# Suppliers tab
# =========================================================

class SupplierEngagement(BaseModel):
    """How a supplier has performed on *this buyer's* RFQs only."""

    quotations: int
    eligible: int
    ineligible: int
    awards: int
    awarded_value: Decimal
    eligibility_rate: float | None = None


# How well a supplier's catalogue matches the buyer's own RFQ product names.
class SupplierRelevance(BaseModel):
    matching_rfqs: int = 0
    matched_keywords: list[str] = []


class SupplierDirectoryItem(BaseModel):
    id: int
    company_name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    joined_at: datetime
    catalogue_items: int
    engagement: SupplierEngagement
    relevance: SupplierRelevance


class SupplierDirectoryStats(BaseModel):
    total_suppliers: int
    engaged_suppliers: int
    suppliers_awarded: int
    catalogue_items: int
    relevant_suppliers: int
    buyer_has_rfqs: bool


class SupplierDirectoryResponse(BaseModel):
    stats: SupplierDirectoryStats
    suppliers: list[SupplierDirectoryItem]


# Buyer-facing catalogue row. Unit price is stored but deliberately not exposed,
# so buyers cannot anchor on a supplier's list price during sealed bidding.
class CatalogueItem(BaseModel):
    id: int
    product_name: str
    description: str | None = None
    available_quantity: int | None = None
    updated_at: datetime | None = None
    matching_rfqs: list[str] = []


class SupplierQuotationHistoryItem(BaseModel):
    quotation_id: int
    quotation_number: str
    rfq_id: int
    rfq_number: str
    product_name: str
    total_price: Decimal
    delivery_days: int
    warranty_months: int
    eligibility: Eligibility
    is_awarded: bool
    submitted_at: datetime


class SupplierProfileResponse(BaseModel):
    supplier: SupplierDirectoryItem
    catalogue: list[CatalogueItem]
    quotation_history: list[SupplierQuotationHistoryItem]
