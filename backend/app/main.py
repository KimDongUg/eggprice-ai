from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.database import Base, engine, init_timescaledb
from app.core.rate_limit import limiter
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.api import prices, predictions, alerts, market_data, auth, email_report

# Import all models so Base.metadata knows about them
from app.models import price, prediction, alert, user  # noqa: F401
from app.models import market_data as market_data_models  # noqa: F401


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    init_timescaledb()
    start_scheduler()

    # Sentry (guarded — no-op when DSN is empty)
    if settings.SENTRY_DSN:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            send_default_pii=False,
            integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        )

    # Cache warming — pre-populate frequently accessed data
    from app.core.cache import warm_cache
    from app.core.database import SessionLocal
    try:
        db = SessionLocal()
        warm_cache(db)
        db.close()
    except Exception:
        pass  # non-fatal: first request will populate cache

    yield
    shutdown_scheduler()


app = FastAPI(
    title="EggPrice AI",
    description="계란 가격 예측 AI 서비스 — LSTM 기반 다변량 시계열 예측",
    version="3.0.0",
    lifespan=lifespan,
)

# ── Rate limiter ────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware (order matters — last added runs first = outermost) ──
app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

# GZip must be outermost to compress final response
app.add_middleware(GZipMiddleware, minimum_size=500)

# ── Prometheus metrics ──────────────────────────────────
from app.core.metrics import setup_metrics  # noqa: E402

setup_metrics(app)

# ── API v1 routes ───────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1")
app.include_router(prices.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(alerts.router, prefix="/api/v1")
app.include_router(market_data.router, prefix="/api/v1")
app.include_router(email_report.router, prefix="/api/v1")


@app.get("/")
def root_health_check():
    return {"status": "ok"}


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "EggPrice AI", "version": "3.0.0"}
