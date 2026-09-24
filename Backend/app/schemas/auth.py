from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

    role: UserRole

    terms_accepted: bool


class RegisterResponse(BaseModel):
    message: str
    user_id: int
    full_name: str
    email: EmailStr
    role: UserRole



class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    full_name: str
    email: EmailStr
    role: UserRole    