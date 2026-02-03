from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # KAMIS (egg prices)
    KAMIS_API_KEY: str = ""
    KAMIS_API_ID: str = ""

    # aT (feed prices)
    AT_API_KEY: str = ""

    # Bank of Korea (exchange rates)
    BOK_API_KEY: str = ""

    # KMA (weather)
    KMA_API_KEY: str = ""

    # Database (PostgreSQL + TimescaleDB)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/eggprice"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 300  # 5 minutes

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # JWT Authentication
    JWT_SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""

    # Kakao OAuth
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""

    # Naver OAuth
    NAVER_CLIENT_ID: str = ""
    NAVER_CLIENT_SECRET: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Frontend URL (OAuth callback redirect)
    FRONTEND_URL: str = "http://localhost:3000"

    CORS_ORIGINS: str = "http://localhost:3000,https://eggprice-ai.vercel.app"
    MODEL_VERSION: str = "v2.0"

    # Security
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_API: str = "60/minute"
    RATE_LIMIT_STORAGE_URI: str = "memory://"

    # Sentry
    SENTRY_DSN: str = ""
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 0.2

    # AWS S3 (model storage)
    AWS_S3_BUCKET: str = ""
    AWS_REGION: str = "ap-northeast-2"

    # Retraining thresholds
    MAPE_RETRAIN_THRESHOLD: float = 7.0
    RETRAIN_INTERVAL_DAYS: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
