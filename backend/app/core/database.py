from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

connect_args = {}
engine_kwargs = {"pool_pre_ping": True}

if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_timescaledb():
    """Enable TimescaleDB extension and convert egg_prices to hypertable.

    Safe to call multiple times — skips if already configured.
    Only runs on PostgreSQL with TimescaleDB extension available.
    """
    if "sqlite" in settings.DATABASE_URL:
        return

    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE"))
            conn.commit()
        except Exception:
            conn.rollback()
            return  # TimescaleDB not available — skip

        # Convert egg_prices to hypertable (idempotent check)
        result = conn.execute(text(
            "SELECT EXISTS ("
            "  SELECT 1 FROM timescaledb_information.hypertables "
            "  WHERE hypertable_name = 'egg_prices'"
            ")"
        ))
        is_hypertable = result.scalar()
        if not is_hypertable:
            try:
                conn.execute(text(
                    "SELECT create_hypertable('egg_prices', 'date', "
                    "migrate_data => true, if_not_exists => true)"
                ))
                conn.commit()
            except Exception:
                conn.rollback()
