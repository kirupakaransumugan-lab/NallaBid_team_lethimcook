from datetime import datetime

from pydantic import BaseModel, Field


class RFQCreate(BaseModel):
    product_name: str = Field(
        min_length=2,
        max_length=150
    )

    description: str | None = None

    quantity: int = Field(
        gt=0
    )

    max_delivery_days: int = Field(
        gt=0
    )

    min_warranty_months: int = Field(
        ge=0
    )

    deadline: datetime


class RFQUpdate(BaseModel):
    product_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150
    )

    description: str | None = None

    quantity: int | None = Field(
        default=None,
        gt=0
    )

    max_delivery_days: int | None = Field(
        default=None,
        gt=0
    )

    min_warranty_months: int | None = Field(
        default=None,
        ge=0
    )

    deadline: datetime | None = None


class RFQResponse(BaseModel):
    id: int
    rfq_number: str
    buyer_id: int
    product_name: str
    description: str | None
    quantity: int
    max_delivery_days: int
    min_warranty_months: int
    deadline: datetime
    status: str
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class RFQListItem(BaseModel):
    id: int
    rfq_number: str
    product_name: str
    quantity: int
    deadline: datetime
    status: str
    quotation_count: int


class DashboardStats(BaseModel):
    total_rfqs: int
    quotations_received: int
    pending_evaluation: int
    awarded: int


class RecentRFQ(BaseModel):
    id: int
    rfq_number: str
    product_name: str
    deadline: datetime
    quotation_count: int
    status: str


class RFQStatusOverview(BaseModel):
    draft: int
    open: int
    closed: int
    awarded: int


class UpcomingDeadline(BaseModel):
    id: int
    rfq_number: str
    product_name: str
    deadline: datetime
    days_left: int
    status: str


class QuotationTrendItem(BaseModel):
    month: str
    quotation_count: int


class BuyerDashboardResponse(BaseModel):
    stats: DashboardStats
    recent_rfqs: list[RecentRFQ]
    status_overview: RFQStatusOverview
    upcoming_deadlines: list[UpcomingDeadline]
    quotation_trend: list[QuotationTrendItem]