"""Two-tier cache: L1 in-memory (fast) + L2 Redis (distributed)."""

import json
import logging
import time
from collections import OrderedDict
from functools import wraps
from threading import Lock
from typing import Any

import redis

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── L1: In-memory LRU cache ──────────────────────────────

_L1_MAX_SIZE = 100
_L1_TTL = 60  # seconds


class _L1Cache:
    """Thread-safe in-memory LRU cache with TTL."""

    def __init__(self, max_size: int = _L1_MAX_SIZE, ttl: int = _L1_TTL):
        self._data: OrderedDict[str, tuple[float, Any]] = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl
        self._lock = Lock()

    def get(self, key: str) -> Any | None:
        with self._lock:
            item = self._data.get(key)
            if item is None:
                return None
            ts, value = item
            if time.time() - ts > self._ttl:
                del self._data[key]
                return None
            self._data.move_to_end(key)
            return value

    def set(self, key: str, value: Any):
        with self._lock:
            self._data[key] = (time.time(), value)
            self._data.move_to_end(key)
            while len(self._data) > self._max_size:
                self._data.popitem(last=False)

    def clear(self):
        with self._lock:
            self._data.clear()


_l1 = _L1Cache()

# ── L2: Redis cache ──────────────────────────────────────

_redis_pool: redis.ConnectionPool | None = None
_redis_client: redis.Redis | None = None
_redis_unavailable: bool = False  # avoid repeated connection attempts


def get_redis() -> redis.Redis | None:
    """Get Redis client with connection pooling. Returns None if unavailable."""
    global _redis_pool, _redis_client, _redis_unavailable
    if _redis_unavailable:
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        if _redis_pool is None:
            _redis_pool = redis.ConnectionPool.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                max_connections=20,
                socket_connect_timeout=1,
                socket_timeout=1,
                retry_on_timeout=False,
            )
        _redis_client = redis.Redis(connection_pool=_redis_pool)
        _redis_client.ping()
        return _redis_client
    except Exception:
        logger.debug("Redis not available, L2 cache disabled")
        _redis_unavailable = True
        _redis_client = None
        return None


# ── Public API ────────────────────────────────────────────

def cache_get(key: str) -> Any | None:
    """Get from L1 first, then L2 (Redis). Returns None on miss."""
    # L1 check
    hit = _l1.get(key)
    if hit is not None:
        return hit

    # L2 check
    r = get_redis()
    if r is None:
        return None
    try:
        data = r.get(key)
        if data is not None:
            value = json.loads(data)
            _l1.set(key, value)  # promote to L1
            return value
    except Exception:
        pass
    return None


def cache_set(key: str, value: Any, ttl: int | None = None):
    """Write to both L1 and L2."""
    if ttl is None:
        ttl = settings.CACHE_TTL_SECONDS

    # L1
    _l1.set(key, value)

    # L2
    r = get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


def cache_delete(pattern: str):
    """Delete cached keys matching a pattern from both layers."""
    _l1.clear()  # simple clear for L1 (no pattern match needed)

    r = get_redis()
    if r is None:
        return
    try:
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
    except Exception:
        pass


def warm_cache(db):
    """Pre-warm cache with frequently accessed data on startup."""
    from app.services.price_service import get_current_prices
    from app.models.price import EggPrice
    from datetime import date, timedelta
    import random

    GRADES = ["왕란", "특란", "대란", "중란", "소란"]
    BASE_RETAIL = {"왕란": 7800, "특란": 7200, "대란": 6500, "중란": 5800, "소란": 5200}
    BASE_WHOLESALE = {"왕란": 6500, "특란": 6000, "대란": 5400, "중란": 4800, "소란": 4200}

    # ── 데이터가 없으면 90일치 샘플 자동 생성 ──
    try:
        count = db.query(EggPrice).count()
        if count == 0:
            logger.info("No price data found — generating 90-day sample data...")
            today = date.today()
            for i in range(90):
                d = today - timedelta(days=89 - i)
                for grade in GRADES:
                    drift = i * 1.5 + random.gauss(0, 80)
                    db.add(EggPrice(
                        date=d,
                        grade=grade,
                        retail_price=round(BASE_RETAIL[grade] + drift),
                        wholesale_price=round(BASE_WHOLESALE[grade] + drift * 0.8),
                        unit="30개",
                    ))
            db.commit()
            logger.info(f"Generated {len(GRADES) * 90} sample price records")

            # 예측 데이터도 함께 생성
            from app.models.prediction import Prediction
            for grade in GRADES:
                base_price = BASE_RETAIL[grade] + 89 * 1.5
                for days in range(1, 31):
                    predicted = base_price * (1 + 0.002 * days) + (days % 5 - 2) * 10
                    db.add(Prediction(
                        base_date=today,
                        target_date=today + timedelta(days=days),
                        grade=grade,
                        predicted_price=round(predicted, 2),
                        confidence_lower=round(predicted * 0.97, 2),
                        confidence_upper=round(predicted * 1.03, 2),
                        horizon_days=days,
                        model_version="sample_v1",
                    ))
            db.commit()
            logger.info(f"Generated {len(GRADES) * 30} sample prediction records")
    except Exception as e:
        db.rollback()
        logger.warning(f"Sample data generation failed: {e}")

    # ── 현재 가격 캐싱 ──
    try:
        result = get_current_prices(db)
        if result:
            cache_set("prices:current", result, ttl=180)
            logger.info("Cache warmed: prices:current")
    except Exception as e:
        logger.debug(f"Cache warm failed for prices:current: {e}")


def cached(prefix: str, ttl: int | None = None):
    """Decorator to cache function results (L1 + L2).

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
