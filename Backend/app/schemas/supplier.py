from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SupplierResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class SupplierCatalogueCreate(BaseModel):
    product_name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    unit_price: Decimal | None = Field(default=None, ge=0)
    available_quantity: int | None = Field(default=None, ge=0)


class SupplierCatalogueUpdate(BaseModel):
    product_name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    unit_price: Decimal | None = Field(default=None, ge=0)
    available_quantity: int | None = Field(default=None, ge=0)


class SupplierCatalogueResponse(BaseModel):
    id: int
    supplier_id: int
    product_name: str
    description: str | None = None
    unit_price: Decimal | None = None
    available_quantity: int | None = None
    created_at: datetime
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
