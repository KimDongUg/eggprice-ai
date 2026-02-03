"""OAuth service: token exchange and user lookup/creation for social login."""

from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User


# ── Kakao ────────────────────────────────────────────

async def get_kakao_token(code: str, redirect_uri: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.KAKAO_CLIENT_ID,
                "client_secret": settings.KAKAO_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def get_kakao_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        data = resp.json()

    kakao_account = data.get("kakao_account", {})
    profile = kakao_account.get("profile", {})
    return {
        "provider_id": str(data["id"]),
        "email": kakao_account.get("email"),
        "name": profile.get("nickname"),
        "profile_image": profile.get("profile_image_url"),
    }


# ── Naver ────────────────────────────────────────────

async def get_naver_token(code: str, state: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://nid.naver.com/oauth2.0/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.NAVER_CLIENT_ID,
                "client_secret": settings.NAVER_CLIENT_SECRET,
                "code": code,
                "state": state,
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def get_naver_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        data = resp.json()["response"]

    return {
        "provider_id": data["id"],
        "email": data.get("email"),
        "name": data.get("name") or data.get("nickname"),
        "profile_image": data.get("profile_image"),
    }


# ── Google ───────────────────────────────────────────

async def get_google_token(code: str, redirect_uri: str) -> str:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def get_google_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        data = resp.json()

    return {
        "provider_id": data["id"],
        "email": data.get("email"),
        "name": data.get("name"),
        "profile_image": data.get("picture"),
    }


# ── Shared: find or create user ─────────────────────

def find_or_create_social_user(
    db: Session,
    provider: str,
    provider_id: str,
    email: Optional[str],
    name: Optional[str],
    profile_image: Optional[str],
) -> User:
    """Look up a user by provider+provider_id; create one if it doesn't exist."""
    user = (
        db.query(User)
        .filter(User.provider == provider, User.provider_id == provider_id)
        .first()
    )
    if user:
        # Update profile image / name if changed
        if profile_image and user.profile_image != profile_image:
            user.profile_image = profile_image
        if name and user.name != name:
            user.name = name
        db.commit()
        db.refresh(user)
        return user

    # Check if email already used by another account
    if email:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            # Link social login to existing email account
            existing.provider = provider
            existing.provider_id = provider_id
            if profile_image:
                existing.profile_image = profile_image
            db.commit()
            db.refresh(existing)
            return existing

    user = User(
        email=email,
        name=name,
        provider=provider,
        provider_id=provider_id,
        profile_image=profile_image,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
