from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import PasswordChange, ProfileResponse, ProfileUpdate, UserMeResponse
from app.security.auth import get_current_user
from app.services.profile_service import change_password, get_profile, update_profile


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me", response_model=UserMeResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/me/profile", response_model=ProfileResponse)
def read_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_profile(db, current_user)


@router.put("/me/profile", response_model=ProfileResponse)
def save_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return update_profile(db, current_user, profile_data)


@router.put("/me/password")
def update_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    change_password(db, current_user, data.current_password, data.new_password)

    return {
        "message": "Password updated successfully."
    }
