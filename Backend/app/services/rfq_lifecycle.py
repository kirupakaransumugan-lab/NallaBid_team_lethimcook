from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.rfq import RFQ, RFQStatus


# RFQs whose quotations are still sealed: nobody (not even the buyer) may see
# prices or supplier offers until bidding has ended.
SEALED_STATUSES = (RFQStatus.DRAFT, RFQStatus.OPEN)


def is_sealed(rfq: RFQ) -> bool:
    return rfq.status in SEALED_STATUSES


def to_utc_naive(value: datetime) -> datetime:
    """The browser sends UTC timestamps ("...Z"); the DB column and utcnow() are naive UTC."""
    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    return value


def close_expired_rfqs(db: Session = Depends(get_db)) -> None:
    """Router dependency: move every OPEN RFQ whose deadline has passed to CLOSED.

    Runs before each buyer request, so status, sealed bids and the close/evaluate
    rules always see the real state without needing a background scheduler.
    One indexed UPDATE; it touches no rows when nothing has expired.
    """
    now = datetime.utcnow()

    result = db.execute(
        update(RFQ)
        .where(RFQ.status == RFQStatus.OPEN, RFQ.deadline <= now)
        .values(status=RFQStatus.CLOSED, updated_at=now)
    )

    if result.rowcount:
        db.commit()
