from datetime import datetime
import enum

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AwardStatus(str, enum.Enum):
    AWARDED = "AWARDED"
    COMPLETED = "COMPLETED"


# Mirrors the existing MySQL `awards` table. The UNIQUE constraints on rfq_id and
# quotation_id are the final guard against duplicate awards under concurrency.
class Award(Base):
    __tablename__ = "awards"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    rfq_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("rfqs.id"), unique=True, nullable=False)
    quotation_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("quotations.id"), unique=True, nullable=False)
    # Must match users.id (INT) or MySQL rejects the foreign key.
    awarded_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    status: Mapped[AwardStatus] = mapped_column(Enum(AwardStatus), default=AwardStatus.AWARDED, nullable=False)

    quotation = relationship("Quotation", back_populates="award")
