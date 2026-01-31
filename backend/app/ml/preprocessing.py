"""Feature engineering and data preprocessing for the LSTM model.

15 features, 30-day lookback window.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler


SEQUENCE_LENGTH = 30

# 15 input features
FEATURE_COLUMNS = [
    "price",                # 1. 소비자가
    "wholesale_price",      # 2. 산지가
    "volume",               # 3. 거래량
    "corn_price",           # 4. 사료(옥수수) 가격
    "exchange_rate",        # 5. 환율 (USD/KRW)
    "avian_flu",            # 6. 조류독감 발생 여부 (0/1)
    "temperature",          # 7. 평균 기온
    "day_of_week_sin",      # 8. 요일 sin
    "day_of_week_cos",      # 9. 요일 cos
    "month_sin",            # 10. 월 sin
    "month_cos",            # 11. 월 cos
    "price_ma7",            # 12. 7일 이동평균
    "price_ma14",           # 13. 14일 이동평균
    "price_volatility_7",   # 14. 7일 변동성 (std)
    "price_momentum",       # 15. 가격 모멘텀 (7일 수익률)
]


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Build all 15 features from a merged DataFrame.

    Expected input columns: date, retail_price.
    Optional columns (filled with defaults if missing):
        wholesale_price, volume, corn_price, exchange_rate,
        avian_flu, temperature.
    """
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)

    # Core price
    df["price"] = df["retail_price"].astype(float)

    # Fill optional columns with forward-fill then default
    optional_defaults = {
        "wholesale_price": df["price"],  # fallback to retail
        "volume": 0.0,
        "corn_price": 0.0,
        "exchange_rate": 0.0,
        "avian_flu": 0.0,
        "temperature": 0.0,
    }
    for col, default in optional_defaults.items():
        if col not in df.columns:
            if isinstance(default, pd.Series):
                df[col] = default
            else:
                df[col] = default
        else:
            df[col] = df[col].ffill().fillna(
                default if not isinstance(default, pd.Series) else 0.0
            )

    # Ensure numeric
    for col in ["wholesale_price", "volume", "corn_price", "exchange_rate", "avian_flu", "temperature"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    # Cyclical day-of-week encoding
    dow = df["date"].dt.dayofweek
    df["day_of_week_sin"] = np.sin(2 * np.pi * dow / 7)
    df["day_of_week_cos"] = np.cos(2 * np.pi * dow / 7)

    # Cyclical month encoding
    month = df["date"].dt.month
    df["month_sin"] = np.sin(2 * np.pi * month / 12)
    df["month_cos"] = np.cos(2 * np.pi * month / 12)

    # Moving averages
    df["price_ma7"] = df["price"].rolling(window=7, min_periods=1).mean()
    df["price_ma14"] = df["price"].rolling(window=14, min_periods=1).mean()

    # 7-day price volatility (rolling std)
    df["price_volatility_7"] = df["price"].rolling(window=7, min_periods=1).std().fillna(0)

    # Price momentum: 7-day return
    df["price_momentum"] = df["price"].pct_change(periods=7).fillna(0)
    # Clip extreme momentum values
    df["price_momentum"] = df["price_momentum"].clip(-1, 1)

    return df


def build_features_from_db(db_session, grade: str) -> pd.DataFrame:
    """Load all data sources from DB and build a merged feature DataFrame."""
    from app.models.price import EggPrice
    from app.models.market_data import (
        TradingVolume,
        FeedPrice,
        ExchangeRate,
        AvianFluStatus,
        WeatherData,
    )

    # Load egg prices
    prices = (
        db_session.query(EggPrice)
        .filter(EggPrice.grade == grade, EggPrice.retail_price.isnot(None))
        .order_by(EggPrice.date)
        .all()
    )
    if not prices:
        raise ValueError(f"No price data for grade '{grade}'")

    df = pd.DataFrame([{
        "date": p.date,
        "retail_price": p.retail_price,
        "wholesale_price": p.wholesale_price,
    } for p in prices])

    # Load and merge supplementary data
    min_date = df["date"].min()

    # Trading volume
    volumes = db_session.query(TradingVolume).filter(TradingVolume.date >= min_date).all()
    if volumes:
        vol_df = pd.DataFrame([{"date": v.date, "volume": v.volume_kg} for v in volumes])
        df = df.merge(vol_df, on="date", how="left")

    # Feed prices (use 옥수수 as corn_price)
    feeds = (
        db_session.query(FeedPrice)
        .filter(FeedPrice.date >= min_date, FeedPrice.feed_type == "옥수수")
        .all()
    )
    if feeds:
        feed_df = pd.DataFrame([{"date": f.date, "corn_price": f.price} for f in feeds])
        df = df.merge(feed_df, on="date", how="left")

    # Exchange rates
    rates = db_session.query(ExchangeRate).filter(ExchangeRate.date >= min_date).all()
    if rates:
        rate_df = pd.DataFrame([{"date": r.date, "exchange_rate": r.usd_krw} for r in rates])
        df = df.merge(rate_df, on="date", how="left")

    # Avian flu
    flu_records = db_session.query(AvianFluStatus).filter(AvianFluStatus.date >= min_date).all()
    if flu_records:
        flu_df = pd.DataFrame([{
            "date": f.date,
            "avian_flu": 1.0 if f.is_outbreak else 0.0,
        } for f in flu_records])
        df = df.merge(flu_df, on="date", how="left")

    # Weather
    weather = db_session.query(WeatherData).filter(WeatherData.date >= min_date).all()
    if weather:
        wx_df = pd.DataFrame([{"date": w.date, "temperature": w.avg_temperature} for w in weather])
        df = df.merge(wx_df, on="date", how="left")

    # Forward-fill merged columns before feature engineering
    for col in ["volume", "corn_price", "exchange_rate", "avian_flu", "temperature", "wholesale_price"]:
        if col in df.columns:
            df[col] = df[col].ffill().fillna(0.0)

    return build_features(df)


def create_sequences(
    features: np.ndarray,
    targets: np.ndarray | None = None,
    seq_length: int = SEQUENCE_LENGTH,
) -> tuple[np.ndarray, np.ndarray | None]:
    """Create sliding window sequences for LSTM input.

    Args:
        features: (N, num_features) array
        targets: (N, num_targets) array or None for inference
        seq_length: lookback window size

    Returns:
        X: (num_sequences, seq_length, num_features)
        y: (num_sequences, num_targets) or None
    """
    X = []
    y = [] if targets is not None else None

    for i in range(len(features) - seq_length):
        X.append(features[i : i + seq_length])
        if targets is not None:
            y.append(targets[i + seq_length])

    X = np.array(X, dtype=np.float32)
    if y is not None:
        y = np.array(y, dtype=np.float32)
    return X, y


class PriceScaler:
    """Wraps MinMaxScaler for feature and target scaling."""

    def __init__(self):
        self.feature_scaler = MinMaxScaler()
        self.target_scaler = MinMaxScaler()

    def fit_transform(self, df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        """Fit scalers and return scaled features + targets.

        Returns:
            features: (N, 15) scaled feature array
            targets: (N, 3) target array with 7d/14d/30d future prices
        """
        features = df[FEATURE_COLUMNS].values
        scaled_features = self.feature_scaler.fit_transform(features)

        # Build multi-horizon targets (future price at 7, 14, 30 days)
        price = df["price"].values
        targets = np.full((len(price), 3), np.nan)
        for i in range(len(price)):
            if i + 7 < len(price):
                targets[i, 0] = price[i + 7]
            if i + 14 < len(price):
                targets[i, 1] = price[i + 14]
            if i + 30 < len(price):
                targets[i, 2] = price[i + 30]

        # Only keep rows where all targets exist
        valid_mask = ~np.isnan(targets).any(axis=1)
        targets_valid = targets[valid_mask]
        scaled_features_valid = scaled_features[valid_mask]

        self.target_scaler.fit(targets_valid)
        scaled_targets = self.target_scaler.transform(targets_valid)

        return scaled_features_valid, scaled_targets

    def transform_features(self, df: pd.DataFrame) -> np.ndarray:
        """Transform features only (for inference)."""
        features = df[FEATURE_COLUMNS].values
        return self.feature_scaler.transform(features)

    def inverse_transform_targets(self, scaled_targets: np.ndarray) -> np.ndarray:
        """Convert scaled predictions back to original price scale."""
        return self.target_scaler.inverse_transform(scaled_targets)
