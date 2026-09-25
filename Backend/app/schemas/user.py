from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


def _blank_to_none(value):
    # Empty form fields arrive as ""; store them as NULL instead.
    if isinstance(value, str) and not value.strip():
        return None

    return value.strip() if isinstance(value, str) else value


class UserMeResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProfileResponse(BaseModel):
    full_name: str
    email: str
    role: UserRole
    member_since: datetime
    company_name: str | None = None
    company_email: str | None = None
    phone: str | None = None
    address: str | None = None
    profile_completed: bool


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    company_name: str = Field(min_length=2, max_length=150)
    company_email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30, pattern=r"^[0-9+()\-\s]{7,30}$")
    address: str | None = Field(default=None, max_length=500)

    # Role, login email and ownership are never taken from the request.
    model_config = ConfigDict(extra="forbid")

    _strip = field_validator("full_name", "company_name", "company_email", "phone", "address", mode="before")(
        _blank_to_none
    )


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
