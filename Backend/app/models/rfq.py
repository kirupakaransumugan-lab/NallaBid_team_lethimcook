from datetime import datetime
from enum import Enum

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    String,
    Text,
    Integer,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RFQStatus(str, Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    AWARDED = "AWARDED"
    COMPLETED = "COMPLETED"


class RFQ(Base):
    __tablename__ = "rfqs"

    # --------------------------------------------------
    # Primary Key
    # --------------------------------------------------

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
        index=True
    )

    # --------------------------------------------------
    # RFQ Reference Number
    # Example: RFQ-2026-0001
    # --------------------------------------------------

    rfq_number: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True
    )

    # --------------------------------------------------
    # Buyer
    # users.id
    # --------------------------------------------------

    # Must match users.id (INT) or MySQL rejects the foreign key.
    buyer_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # --------------------------------------------------
    # RFQ Product Information
    # --------------------------------------------------

    product_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    # --------------------------------------------------
    # Supplier Requirements
    # --------------------------------------------------

    max_delivery_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    min_warranty_months: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    # --------------------------------------------------
    # Deadline
    # --------------------------------------------------

    deadline: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True
    )

    # --------------------------------------------------
    # RFQ Status
    # --------------------------------------------------

    status: Mapped[RFQStatus] = mapped_column(
        SQLEnum(
            RFQStatus,
            name="rfq_status",
            native_enum=True
        ),
        nullable=False,
        default=RFQStatus.DRAFT,
        index=True
    )

    # --------------------------------------------------
    # Timestamps
    # --------------------------------------------------

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        server_default=func.now(),
        onupdate=func.now()
    )

    quotations = relationship(
        "Quotation",
        back_populates="rfq"
    )

    # --------------------------------------------------
    # Table Indexes
    # --------------------------------------------------

    __table_args__ = (
        Index(
            "ix_rfqs_buyer_status",
            "buyer_id",
            "status"
        ),
        Index(
            "ix_rfqs_buyer_deadline",
            "buyer_id",
            "deadline"
        ),
    )