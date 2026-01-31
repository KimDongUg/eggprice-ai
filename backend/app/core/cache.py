"""Redis cache service for API response caching."""

import json
import logging
from functools import wraps
from typing import Any

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis | None:
    """Get Redis client, returning None if unavailable."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
        )
        _redis_client.ping()
        return _redis_client
    except Exception:
        logger.debug("Redis not available, caching disabled")
        _redis_client = None
        return None


def cache_get(key: str) -> Any | None:
    """Get a cached value. Returns None on miss or error."""
    r = get_redis()
    if r is None:
        return None
    try:
        data = r.get(key)
        if data is not None:
            return json.loads(data)
    except Exception:
        pass
    return None


def cache_set(key: str, value: Any, ttl: int | None = None):
    """Set a cached value. Silently fails if Redis is unavailable."""
    r = get_redis()
    if r is None:
        return
    if ttl is None:
        ttl = settings.CACHE_TTL_SECONDS
    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


def cache_delete(pattern: str):
    """Delete cached keys matching a pattern."""
    r = get_redis()
    if r is None:
        return
    try:
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
    except Exception:
        pass


def cached(prefix: str, ttl: int | None = None):
    """Decorator to cache function results in Redis.

    The cache key is built from the prefix and function arguments.
    Only works with JSON-serializable return values.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key from args (skip 'db' session objects)
            key_parts = [prefix]
            for v in kwargs.values():
                if hasattr(v, "execute"):  # skip SQLAlchemy sessions
                    continue
                key_parts.append(str(v))
            cache_key = ":".join(key_parts)

            # Try cache
            hit = cache_get(cache_key)
            if hit is not None:
                return hit

            # Call function
            result = await func(*args, **kwargs)

            # Store in cache
            cache_set(cache_key, result, ttl)
            return result

        return wrapper
    return decorator
