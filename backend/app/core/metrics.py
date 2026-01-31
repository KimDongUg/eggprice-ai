"""Prometheus metrics setup and custom gauges."""

from prometheus_client import Gauge
from prometheus_fastapi_instrumentator import Instrumentator

model_mape_gauge = Gauge(
    "eggprice_model_mape",
    "Current MAPE of the production model",
    ["grade"],
)


def setup_metrics(app):
    """Instrument the FastAPI app with Prometheus metrics."""
    Instrumentator(
        should_group_status_codes=True,
        excluded_handlers=["/metrics", "/api/v1/health"],
    ).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
