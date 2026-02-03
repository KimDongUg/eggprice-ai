"""OAuth endpoints for Kakao, Naver, Google social login."""

import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.services.oauth_service import (
    find_or_create_social_user,
    get_google_token,
    get_google_user,
    get_kakao_token,
    get_kakao_user,
    get_naver_token,
    get_naver_user,
)

router = APIRouter(tags=["oauth"])


def _build_frontend_redirect(access_token: str, refresh_token: str) -> str:
    """Build the frontend callback URL with tokens in the URL fragment."""
    return f"{settings.FRONTEND_URL}/login/callback#access_token={access_token}&refresh_token={refresh_token}"


def _build_frontend_error_redirect(error: str) -> str:
    return f"{settings.FRONTEND_URL}/login?error={error}"


# ── Kakao ────────────────────────────────────────────

@router.get("/auth/kakao/login")
async def kakao_login(request: Request):
    redirect_uri = str(request.url_for("kakao_callback"))
    params = urlencode({
        "client_id": settings.KAKAO_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
    })
    return RedirectResponse(f"https://kauth.kakao.com/oauth/authorize?{params}")


@router.get("/auth/kakao/callback")
async def kakao_callback(request: Request, code: str = "", error: str = "", db: Session = Depends(get_db)):
    if error or not code:
        return RedirectResponse(_build_frontend_error_redirect("kakao_auth_failed"))
    try:
        redirect_uri = str(request.url_for("kakao_callback"))
        access_token = await get_kakao_token(code, redirect_uri)
        user_info = await get_kakao_user(access_token)
        user = find_or_create_social_user(
            db,
            provider="kakao",
            provider_id=user_info["provider_id"],
            email=user_info.get("email"),
            name=user_info.get("name"),
            profile_image=user_info.get("profile_image"),
        )
        jwt_access = create_access_token(user.id)
        jwt_refresh = create_refresh_token(user.id)
        return RedirectResponse(_build_frontend_redirect(jwt_access, jwt_refresh))
    except Exception:
        return RedirectResponse(_build_frontend_error_redirect("kakao_auth_failed"))


# ── Naver ────────────────────────────────────────────

@router.get("/auth/naver/login")
async def naver_login(request: Request):
    redirect_uri = str(request.url_for("naver_callback"))
    state = secrets.token_urlsafe(16)
    params = urlencode({
        "client_id": settings.NAVER_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "state": state,
    })
    return RedirectResponse(f"https://nid.naver.com/oauth2.0/authorize?{params}")


@router.get("/auth/naver/callback")
async def naver_callback(request: Request, code: str = "", state: str = "", error: str = "", db: Session = Depends(get_db)):
    if error or not code:
        return RedirectResponse(_build_frontend_error_redirect("naver_auth_failed"))
    try:
        access_token = await get_naver_token(code, state)
        user_info = await get_naver_user(access_token)
        user = find_or_create_social_user(
            db,
            provider="naver",
            provider_id=user_info["provider_id"],
            email=user_info.get("email"),
            name=user_info.get("name"),
            profile_image=user_info.get("profile_image"),
        )
        jwt_access = create_access_token(user.id)
        jwt_refresh = create_refresh_token(user.id)
        return RedirectResponse(_build_frontend_redirect(jwt_access, jwt_refresh))
    except Exception:
        return RedirectResponse(_build_frontend_error_redirect("naver_auth_failed"))


# ── Google ───────────────────────────────────────────

@router.get("/auth/google/login")
async def google_login(request: Request):
    redirect_uri = str(request.url_for("google_callback"))
    params = urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/auth/google/callback")
async def google_callback(request: Request, code: str = "", error: str = "", db: Session = Depends(get_db)):
    if error or not code:
        return RedirectResponse(_build_frontend_error_redirect("google_auth_failed"))
    try:
        redirect_uri = str(request.url_for("google_callback"))
        access_token = await get_google_token(code, redirect_uri)
        user_info = await get_google_user(access_token)
        user = find_or_create_social_user(
            db,
            provider="google",
            provider_id=user_info["provider_id"],
            email=user_info.get("email"),
            name=user_info.get("name"),
            profile_image=user_info.get("profile_image"),
        )
        jwt_access = create_access_token(user.id)
        jwt_refresh = create_refresh_token(user.id)
        return RedirectResponse(_build_frontend_redirect(jwt_access, jwt_refresh))
    except Exception:
        return RedirectResponse(_build_frontend_error_redirect("google_auth_failed"))
