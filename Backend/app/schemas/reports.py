from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


Eligibility = Literal["ELIGIBLE", "INELIGIBLE", "PENDING"]


# =========================================================
# Shared
# =========================================================

class ChartPoint(BaseModel):
    label: str
    value: float


class SupplierAwardTotal(BaseModel):
    supplier_name: str
    award_count: int
    total_value: Decimal


class RFQOption(BaseModel):
    id: int
    rfq_number: str
    product_name: str
    status: str
    quotation_count: int


# =========================================================
# Dashboard
# =========================================================

class ReportDashboard(BaseModel):
    total_rfqs: int
    draft_rfqs: int
    open_rfqs: int
    closed_rfqs: int
    awarded_rfqs: int
    completed_rfqs: int

    total_quotations: int
    eligible_quotations: int
    ineligible_quotations: int
    pending_quotations: int

    total_awards: int
    total_awarded_value: Decimal

    rfq_status_distribution: list[ChartPoint]
    monthly_rfq_count: list[ChartPoint]
    monthly_quotation_count: list[ChartPoint]
    eligibility_distribution: list[ChartPoint]
    awards_by_supplier: list[SupplierAwardTotal]


# =========================================================
# Report 1 - RFQ comparison
# =========================================================

class ComparisonRFQ(BaseModel):
    id: int
    rfq_number: str
    product_name: str
    quantity: int
    max_delivery_days: int
    min_warranty_months: int
    status: str


class RFQComparisonRow(BaseModel):
    rfq_number: str
    product_name: str
    quotation_id: int
    quotation_number: str
    supplier_name: str
    unit_price: Decimal
    total_price: Decimal
    delivery_days: int
    warranty_months: int
    quotation_status: str
    eligibility: Eligibility
    evaluation_result: str


class RFQComparisonSummary(BaseModel):
    quotation_count: int
    lowest_price: Decimal | None = None
    highest_price: Decimal | None = None
    average_price: Decimal | None = None
    fastest_delivery_days: int | None = None
    highest_warranty_months: int | None = None
    eligible_count: int
    ineligible_count: int
    pending_count: int


class RFQComparisonReport(BaseModel):
    generated_at: datetime
    filters: dict[str, str]
    rfq_options: list[RFQOption]
    rfq: ComparisonRFQ | None = None
    rows: list[RFQComparisonRow]
    summary: RFQComparisonSummary | None = None


# =========================================================
# Report 2 - Supplier eligibility
# =========================================================

class SupplierEligibilityRow(BaseModel):
    supplier_name: str
    rfq_number: str
    quotation_number: str
    product_name: str
    requested_quantity: int
    available_quantity: int | None = None
    quoted_price: Decimal
    delivery_requirement: int
    actual_delivery: int
    warranty_requirement: int
    actual_warranty: int
    eligibility: Eligibility
    failure_reason: str | None = None
    evaluated_at: datetime


class FailureReasonCount(BaseModel):
    reason: str
    count: int


class SupplierEligibilitySummary(BaseModel):
    total_quotations: int
    eligible_quotations: int
    ineligible_quotations: int
    eligibility_percentage: float
    failure_reason_counts: list[FailureReasonCount]


class SupplierEligibilityReport(BaseModel):
    generated_at: datetime
    filters: dict[str, str]
    rfq_options: list[RFQOption]
    rows: list[SupplierEligibilityRow]
    summary: SupplierEligibilitySummary


# =========================================================
# Report 3 - Award summary
# =========================================================

class AwardSummaryRow(BaseModel):
    award_id: int
    rfq_id: int
    rfq_number: str
    product_name: str
    supplier_name: str
    quotation_number: str
    awarded_amount: Decimal
    delivery_days: int
    warranty_months: int
    awarded_at: datetime
    awarded_by_name: str
    status: str


class MonthlyAwardTotal(BaseModel):
    month: str
    award_count: int
    total_value: Decimal


class AwardSummaryStats(BaseModel):
    total_awards: int
    total_awarded_value: Decimal
    average_award_value: Decimal
    awards_by_supplier: list[SupplierAwardTotal]
    awards_by_month: list[MonthlyAwardTotal]


class AwardSummaryReport(BaseModel):
    generated_at: datetime
    filters: dict[str, str]
    rows: list[AwardSummaryRow]
    summary: AwardSummaryStats
