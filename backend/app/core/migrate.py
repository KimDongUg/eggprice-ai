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
    # alerts table columns that may be missing from older schema
    ("alerts", "phone", "VARCHAR(20)", None),
    ("alerts", "notify_email", "BOOLEAN", "TRUE"),
    ("alerts", "notify_sms", "BOOLEAN", "FALSE"),
    ("alerts", "is_active", "BOOLEAN", "TRUE"),
    ("alerts", "created_at", "TIMESTAMP", "NOW()"),
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
            condition VARCHAR(10) NOT NULL,
            threshold_price FLOAT NOT NULL,
            notify_email BOOLEAN DEFAULT TRUE,
            notify_sms BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_alerts_email ON alerts(email);
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
                try:
                    conn.execute(text(ddl))
                    logger.info("Migration: table %s created successfully", table_name)
                except Exception as e:
                    logger.error("Migration: failed to create table %s: %s", table_name, e)
                    raise
        conn.commit()

    # Refresh inspector after creating tables
    insp = inspect(engine)

    # Build a cache of existing columns per table
    existing_columns: dict[str, set[str]] = {}
    for table, column, _, _ in _EXPECTED_COLUMNS:
        if table not in existing_columns and insp.has_table(table):
            existing_columns[table] = {c["name"] for c in insp.get_columns(table)}

    with engine.connect() as conn:
        # Add missing columns to each table
        for table, column, col_type, default in _EXPECTED_COLUMNS:
            if table not in existing_columns:
                continue  # table doesn't exist yet, will be created by create_all()
            if column in existing_columns[table]:
                continue  # column already exists
            default_clause = f" DEFAULT {default}" if default else ""
            stmt = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}{default_clause}"
            logger.info("Migration: %s", stmt)
            try:
                conn.execute(text(stmt))
            except Exception as e:
                logger.warning("Migration: column %s.%s may already exist: %s", table, column, e)

        # Ensure columns are nullable (older schema may have NOT NULL)
        for table, column in _NULLABLE_COLUMNS:
            if table not in existing_columns or column not in existing_columns[table]:
                continue
            stmt = f"ALTER TABLE {table} ALTER COLUMN {column} DROP NOT NULL"
            try:
                conn.execute(text(stmt))
                logger.info("Migration: %s", stmt)
            except Exception:
                pass  # already nullable

        conn.commit()
