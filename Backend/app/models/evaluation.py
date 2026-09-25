from datetime import datetime
import enum

from sqlalchemy import BigInteger, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EvaluationStatus(str, enum.Enum):
    ELIGIBLE = "ELIGIBLE"
    INELIGIBLE = "INELIGIBLE"


# Mirrors the existing MySQL `evaluations` table; one evaluation per quotation.
class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    quotation_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("quotations.id"), unique=True, nullable=False)
    delivery_pass: Mapped[bool] = mapped_column(Boolean, nullable=False)
    warranty_pass: Mapped[bool] = mapped_column(Boolean, nullable=False)
    quantity_pass: Mapped[bool] = mapped_column(Boolean, nullable=False)
    overall_status: Mapped[EvaluationStatus] = mapped_column(Enum(EvaluationStatus), nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    quotation = relationship("Quotation", back_populates="evaluation")
