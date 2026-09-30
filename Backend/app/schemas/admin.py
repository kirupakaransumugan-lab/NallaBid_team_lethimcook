from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.user import UserRole


# =========================================================
# Users
# =========================================================

class AdminUserItem(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    is_admin: bool
    created_at: datetime
    company_name: str | None = None
    # RFQs created (buyer) or quotations submitted (supplier).
    activity_count: int = 0


class AdminStatusUpdate(BaseModel):
    is_active: bool


# =========================================================
# RFQs, quotations and awards
# =========================================================

class AdminRFQItem(BaseModel):
    id: int
    rfq_number: str
    product_name: str
    quantity: int
    status: str
    deadline: datetime
    created_at: datetime
    buyer_id: int
    buyer_name: str
    quotation_count: int


class AdminQuotationItem(BaseModel):
    id: int
    quotation_number: str
    rfq_id: int
    rfq_number: str
    product_name: str
    rfq_status: str
    supplier_id: int
    supplier_user_id: int
    supplier_name: str
    # Prices and terms are None while the RFQ is sealed (DRAFT/OPEN).
    sealed: bool
    unit_price: Decimal | None = None
    total_price: Decimal | None = None
    delivery_days: int | None = None
    warranty_months: int | None = None
    status: str | None = None
    submitted_at: datetime


class AdminAwardItem(BaseModel):
    id: int
    rfq_id: int
    rfq_number: str
    product_name: str
    buyer_name: str
    supplier_name: str
    quotation_number: str
    total_price: Decimal
    status: str
    awarded_at: datetime
    cancelled_at: datetime | None = None
    cancel_reason: str | None = None


# =========================================================
# Detail pages
# =========================================================

class AdminUserDetail(BaseModel):
    user: AdminUserItem
    company_email: str | None = None
    phone: str | None = None
    address: str | None = None
    rfqs: list[AdminRFQItem] = []
    quotations: list[AdminQuotationItem] = []
    awards: list[AdminAwardItem] = []


class AdminRFQDetail(BaseModel):
    rfq: AdminRFQItem
    description: str | None = None
    max_delivery_days: int
    min_warranty_months: int
    buyer_email: str
    quotations: list[AdminQuotationItem]
    awards: list[AdminAwardItem]


# =========================================================
# Dashboard
# =========================================================

class AdminOverview(BaseModel):
    total_users: int
    buyers: int
    suppliers: int
    inactive_users: int
    total_rfqs: int
    rfqs_by_status: dict[str, int]
    total_quotations: int
    sealed_quotations: int
    active_awards: int
    completed_awards: int
    cancelled_awards: int
    awarded_value: Decimal
    recent_users: list[AdminUserItem]
    recent_rfqs: list[AdminRFQItem]
