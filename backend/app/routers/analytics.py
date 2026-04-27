from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Application
from ..schemas import FunnelItem, TimelineItem

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/funnel", response_model=list[FunnelItem])
def get_funnel(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[FunnelItem]:
    user_id = int(current_user["sub"])
    rows = (
        db.query(Application.status, func.count(Application.id).label("count"))
        .filter(Application.user_id == user_id)
        .group_by(Application.status)
        .all()
    )
    return [FunnelItem(status=row.status, count=row.count) for row in rows]


@router.get("/timeline", response_model=list[TimelineItem])
def get_timeline(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[TimelineItem]:
    user_id = int(current_user["sub"])
    rows = (
        db.query(
            Application.applied_date,
            func.count(Application.id).label("count"),
        )
        .filter(Application.user_id == user_id)
        .group_by(Application.applied_date)
        .order_by(Application.applied_date)
        .all()
    )
    return [TimelineItem(date=row.applied_date, count=row.count) for row in rows]
