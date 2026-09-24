from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SupplierCatalogue(Base):
    __tablename__ = "supplier_catalogues"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    supplier_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("suppliers.id"), nullable=False, index=True)
    product_name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    available_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, onupdate=datetime.utcnow, nullable=True)

    supplier = relationship("Supplier", back_populates="catalogues")
