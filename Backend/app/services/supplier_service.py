from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.supplier import Supplier
from app.security.auth import get_current_user


def require_supplier_profile(db: Session = Depends(get_db), current_user=Depends(get_current_user)) -> Supplier:
    if current_user.role != "SUPPLIER":
        raise HTTPException(status_code=403, detail="Supplier access required")
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == current_user.id))
    if supplier is None:
        raise HTTPException(status_code=404, detail="Complete your supplier profile before managing your catalogue.")
    return supplier
