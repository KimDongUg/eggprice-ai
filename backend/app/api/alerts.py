from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.schemas.alert import AlertCreate, AlertResponse
from app.services.alert_service import create_alert, delete_alert, get_alerts_by_email

router = APIRouter(tags=["alerts"])


@router.post("/alerts", response_model=AlertResponse, status_code=201)
@limiter.limit(settings.RATE_LIMIT_API)
async def create_new_alert(
    request: Request,
    alert_data: AlertCreate,
    db: Session = Depends(get_db),
):
    """가격 알림 생성"""
    return create_alert(db, alert_data)


@router.get("/alerts", response_model=list[AlertResponse])
@limiter.limit(settings.RATE_LIMIT_API)
async def list_alerts(
    request: Request,
    email: str = Query(..., description="이메일 주소"),
    db: Session = Depends(get_db),
):
    """이메일별 알림 목록 조회"""
    return get_alerts_by_email(db, email)


@router.delete("/alerts/{alert_id}")
@limiter.limit(settings.RATE_LIMIT_API)
async def remove_alert(
    request: Request,
    alert_id: int,
    db: Session = Depends(get_db),
):
    """알림 삭제"""
    if not delete_alert(db, alert_id):
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    return {"detail": "알림이 삭제되었습니다."}
