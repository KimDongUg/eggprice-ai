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


def run_migrations(engine: Engine) -> None:
    insp = inspect(engine)

    if not insp.has_table("users"):
        return  # table will be created by create_all()

    existing = {c["name"] for c in insp.get_columns("users")}

    with engine.connect() as conn:
        for table, column, col_type, default in _EXPECTED_COLUMNS:
            if column in existing:
                continue
            default_clause = f" DEFAULT {default}" if default else ""
            stmt = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}{default_clause}"
            logger.info("Migration: %s", stmt)
            conn.execute(text(stmt))
        conn.commit()
