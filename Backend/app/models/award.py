from datetime import datetime
import enum

from sqlalchemy import BigInteger, Computed, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AwardStatus(str, enum.Enum):
    AWARDED = "AWARDED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# Mirrors the MySQL `awards` table after migrations/2026-09-28_award_cancellation.sql.
# Cancelled awards are kept as history, so an RFQ may have several award rows;
# the UNIQUE generated column active_rfq_id still allows only one ACTIVE award per RFQ.
class Award(Base):
    __tablename__ = "awards"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    rfq_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("rfqs.id"), nullable=False, index=True)
    quotation_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("quotations.id"), nullable=False, index=True)
    # Must match users.id (INT) or MySQL rejects the foreign key.
    awarded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[AwardStatus] = mapped_column(Enum(AwardStatus), default=AwardStatus.AWARDED, nullable=False)

    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancelled_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    cancel_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # rfq_id while the award is active, NULL once cancelled (NULLs never clash in a UNIQUE index).
    active_rfq_id: Mapped[int | None] = mapped_column(
        BigInteger,
        Computed("CASE WHEN status <> 'CANCELLED' THEN rfq_id END", persisted=True),
        unique=True,
    )

    quotation = relationship("Quotation", back_populates="award", foreign_keys=[quotation_id])


# SQL condition for awards that still count. Use it in every query or join on awards,
# otherwise cancelled history rows would be treated as real awards.
ACTIVE_AWARD = Award.status != AwardStatus.CANCELLED
