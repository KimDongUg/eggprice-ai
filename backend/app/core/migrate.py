"""Lightweight schema migrations for adding missing columns.

create_all() only creates new tables — it does NOT add columns to
existing tables.  This module fills that gap so that deployments
with an older schema pick up new columns automatically.
"""

import logging

from sqlalchemy import Engine, inspect, text

logger = logging.getLogger(__name__)

# (table, column, SQL type, default)
_EXPECTED_COLUMNS = [
    ("users", "provider", "VARCHAR(20)", "'email'"),
    ("users", "provider_id", "VARCHAR(255)", None),
    ("users", "profile_image", "VARCHAR(500)", None),
]

# Columns that must be nullable for social login to work
_NULLABLE_COLUMNS = [
    ("users", "hashed_password"),
    ("users", "email"),
    ("users", "name"),
]


_MISSING_TABLES_SQL = {
    "alerts": """
        CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            grade VARCHAR(10) NOT NULL,
            "condition" VARCHAR(10) NOT NULL,
            threshold_price FLOAT NOT NULL,
            notify_email BOOLEAN DEFAULT TRUE,
            notify_sms BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """,
    "model_performance": """
        CREATE TABLE IF NOT EXISTS model_performance (
            id SERIAL PRIMARY KEY,
            model_version VARCHAR(50) NOT NULL,
            grade VARCHAR(10) NOT NULL,
            eval_date DATE NOT NULL,
            mae FLOAT NOT NULL,
            rmse FLOAT NOT NULL,
            mape FLOAT NOT NULL,
            directional_accuracy FLOAT NOT NULL,
            is_production BOOLEAN DEFAULT FALSE
        )
    """,
}


def run_migrations(engine: Engine) -> None:
    insp = inspect(engine)

    # Create missing tables
    with engine.connect() as conn:
        for table_name, ddl in _MISSING_TABLES_SQL.items():
            if not insp.has_table(table_name):
                logger.info("Migration: creating table %s", table_name)
                conn.execute(text(ddl))
        conn.commit()

    # Refresh inspector after creating tables
    insp = inspect(engine)

    if not insp.has_table("users"):
        return  # table will be created by create_all()

    existing = {c["name"] for c in insp.get_columns("users")}

    with engine.connect() as conn:
        # Add missing columns
        for table, column, col_type, default in _EXPECTED_COLUMNS:
            if column in existing:
                continue
            default_clause = f" DEFAULT {default}" if default else ""
            stmt = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}{default_clause}"
            logger.info("Migration: %s", stmt)
            conn.execute(text(stmt))

        # Ensure columns are nullable (older schema may have NOT NULL)
        for table, column in _NULLABLE_COLUMNS:
            if column not in existing:
                continue
            stmt = f"ALTER TABLE {table} ALTER COLUMN {column} DROP NOT NULL"
            try:
                conn.execute(text(stmt))
                logger.info("Migration: %s", stmt)
            except Exception:
                pass  # already nullable

        conn.commit()
