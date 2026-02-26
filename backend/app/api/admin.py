"""Admin API endpoints — dashboard, analysis, model management, price management."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_admin_user, get_admin_only
from app.models.user import User
from app.schemas.admin import (
    AdminDashboardResponse,
    PredVsActualResponse,
    MarketFactorAnalysisResponse,
    ModelVersionItem,
    RetrainRequestCreate,
    RetrainRequestResponse,
    ManualPriceInput,
    PriceCorrectionResponse,
    DataQualityCheck,
    ErrorAnalysisResponse,
)
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=AdminDashboardResponse)
def dashboard(
    grade: str = Query("대란"),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return admin_service.get_dashboard_kpis(db, grade)


@router.get("/pred-vs-actual", response_model=PredVsActualResponse)
def pred_vs_actual(
    grade: str = Query("대란"),
    horizon_days: int = Query(7),
    days: int = Query(90),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return admin_service.get_pred_vs_actual(db, grade, horizon_days, days)


@router.get("/market-factors", response_model=MarketFactorAnalysisResponse)
def market_factors(
    grade: str = Query("대란"),
    days: int = Query(180),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return admin_service.get_factor_correlations(db, grade, days)


@router.get("/error-analysis", response_model=ErrorAnalysisResponse)
def error_analysis(
    grade: str = Query("대란"),
    horizon_days: int = Query(7),
    days: int = Query(180),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return admin_service.get_error_analysis(db, grade, horizon_days, days)


@router.get("/models", response_model=list[ModelVersionItem])
def model_versions(
    grade: str = Query("대란"),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return admin_service.get_model_versions(db, grade)


@router.post("/models/retrain", response_model=RetrainRequestResponse)
def retrain(
    data: RetrainRequestCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    req = admin_service.request_retrain(db, user.id, data.grade, data.reason)
    return req


@router.get("/models/retrain-requests", response_model=list[RetrainRequestResponse])
def retrain_requests(
    grade: str = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return admin_service.get_retrain_requests(db, grade)


@router.post("/models/{version}/promote")
def promote_model(
    version: str,
    grade: str = Query("대란"),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_only),
):
    ok = admin_service.promote_model(db, grade, version)
    if not ok:
        raise HTTPException(status_code=404, detail="모델 버전을 찾을 수 없습니다.")
    return {"status": "ok", "promoted": version}


@router.post("/prices")
def upsert_price(
    data: ManualPriceInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    price = admin_service.upsert_price(db, user.id, data)
    return {"status": "ok", "id": price.id}


@router.get("/prices/quality", response_model=list[DataQualityCheck])
def data_quality(
    grade: str = Query("대란"),
    days: int = Query(30),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return admin_service.run_data_quality_checks(db, grade, days)


@router.get("/prices/corrections", response_model=list[PriceCorrectionResponse])
def correction_logs(
    days: int = Query(30),
    db: Session = Depends(get_db),
    user: User = Depends(get_admin_user),
):
    return admin_service.get_correction_logs(db, days)
