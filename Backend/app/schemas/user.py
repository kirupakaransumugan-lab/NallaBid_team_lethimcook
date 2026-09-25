from pydantic import BaseModel


class ProfileResponse(BaseModel):
    full_name: str
    email: str
    role: str
    company_name: str
    company_email: str | None = None
    phone: str | None = None
    address: str | None = None


class ProfileUpdate(BaseModel):
    company_name: str
    company_email: str | None = None
    phone: str | None = None
    address: str | None = None
