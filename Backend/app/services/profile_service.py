from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.supplier import Supplier
from app.models.user import User
from app.security.password import hash_password, verify_password


# Buyers keep company details in `companies`, suppliers in `suppliers`;
# the two tables name the business email column differently.
def _profile_record(db: Session, user: User) -> Company | Supplier | None:
    model = Company if user.role == "BUYER" else Supplier
    return db.scalar(select(model).where(model.user_id == user.id))


def _business_email(record) -> str | None:
    if record is None:
        return None

    return record.company_email if isinstance(record, Company) else record.email


def _profile_response(user: User, record) -> dict:
    return {
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "member_since": user.created_at,
        "company_name": record.company_name if record else None,
        "company_email": _business_email(record),
        "phone": record.phone if record else None,
        "address": record.address if record else None,
        "profile_completed": record is not None,
    }


def get_profile(db: Session, user: User) -> dict:
    return _profile_response(user, _profile_record(db, user))


def update_profile(db: Session, user: User, data) -> dict:
    record = _profile_record(db, user)

    # First save creates the company/supplier row; suppliers need it to quote.
    if record is None:
        record = Company(user_id=user.id) if user.role == "BUYER" else Supplier(user_id=user.id)
        db.add(record)

    user.full_name = data.full_name
    record.company_name = data.company_name
    record.phone = data.phone
    record.address = data.address

    if isinstance(record, Company):
        record.company_email = data.company_email
    else:
        record.email = data.company_email

    db.commit()
    db.refresh(user)
    db.refresh(record)

    return _profile_response(user, record)


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if current_password == new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    user.password_hash = hash_password(new_password)
    db.commit()
