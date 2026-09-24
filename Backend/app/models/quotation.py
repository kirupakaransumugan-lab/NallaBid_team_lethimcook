from datetime import datetime
from decimal import Decimal
import enum

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class QuotationStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"
    AWARDED = "AWARDED"


class Quotation(Base):
    __tablename__ = "quotations"
    __table_args__ = (UniqueConstraint("rfq_id", "supplier_id", name="uq_quotation_rfq_supplier"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    quotation_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    rfq_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("rfqs.id"), nullable=False, index=True)
    supplier_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("suppliers.id"), nullable=False, index=True)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    delivery_days: Mapped[int] = mapped_column(Integer, nullable=False)
    warranty_months: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[QuotationStatus] = mapped_column(Enum(QuotationStatus), default=QuotationStatus.SUBMITTED, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=datetime.utcnow, nullable=True)

    supplier = relationship("Supplier", back_populates="quotations")
    rfq = relationship("RFQ", back_populates="quotations")
    # Re-enable once models/evaluation.py and models/award.py define these classes;
    # an unresolved relationship breaks every ORM query, including login.
    # evaluation = relationship("Evaluation", back_populates="quotation", uselist=False)
    # award = relationship("Award", back_populates="quotation", uselist=False)