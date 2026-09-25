from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.user import ProfileResponse, ProfileUpdate
from app.security.auth import get_current_user


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


def get_profile_record(current_user: User):
    if current_user.role == "BUYER":
        profile = current_user.company
    else:
        profile = current_user.supplier

    if profile is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found for this user"
        )

    return profile


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/me/profile", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user)
):
    profile = get_profile_record(current_user)

    if current_user.role == "BUYER":
        profile_email = profile.company_email
    else:
        profile_email = profile.email

    return {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "company_name": profile.company_name,
        "company_email": profile_email,
        "phone": profile.phone,
        "address": profile.address,
    }


@router.put("/me/profile")
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if len(profile_data.company_name.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail="Company name is required"
        )

    profile = get_profile_record(current_user)

    if current_user.role == "BUYER":
        profile.company_email = profile_data.company_email
    else:
        profile.email = profile_data.company_email

    profile.company_name = profile_data.company_name.strip()
    profile.phone = profile_data.phone
    profile.address = profile_data.address

    db.commit()

    return {
        "message": "Profile updated"
    }
