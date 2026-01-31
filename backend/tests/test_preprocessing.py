"""Tests for ML preprocessing pipeline (build_features, create_sequences, PriceScaler)."""

import numpy as np
import pandas as pd
import pytest

from app.ml.preprocessing import (
    FEATURE_COLUMNS,
    SEQUENCE_LENGTH,
    PriceScaler,
    build_features,
    create_sequences,
)


def _make_price_df(n_days: int = 60) -> pd.DataFrame:
    """Create a minimal DataFrame mimicking raw price data."""
    dates = pd.date_range(end=pd.Timestamp.today(), periods=n_days, freq="D")
    return pd.DataFrame({
        "date": dates,
        "retail_price": np.linspace(6000, 6500, n_days),
    })


def _make_full_df(n_days: int = 60) -> pd.DataFrame:
    """Create a DataFrame with all optional columns."""
    dates = pd.date_range(end=pd.Timestamp.today(), periods=n_days, freq="D")
    return pd.DataFrame({
        "date": dates,
        "retail_price": np.linspace(6000, 6500, n_days),
        "wholesale_price": np.linspace(5000, 5400, n_days),
        "volume": np.random.uniform(40000, 60000, n_days),
        "corn_price": np.linspace(340, 360, n_days),
        "exchange_rate": np.linspace(1300, 1320, n_days),
        "avian_flu": np.zeros(n_days),
        "temperature": np.random.uniform(10, 25, n_days),
    })


class TestBuildFeatures:
    def test_output_has_all_feature_columns(self):
        df = build_features(_make_price_df())
        for col in FEATURE_COLUMNS:
            assert col in df.columns, f"Missing feature column: {col}"

    def test_output_length_matches_input(self):
        n = 60
        df = build_features(_make_price_df(n))
        assert len(df) == n

    def test_fills_missing_optional_columns(self):
        """When optional columns are absent, they should be filled with defaults."""
        df = build_features(_make_price_df())
        assert "wholesale_price" in df.columns
        assert "volume" in df.columns
        assert "corn_price" in df.columns
        assert not df["volume"].isna().any()

    def test_cyclical_encoding_range(self):
        """Sin/cos features should be in [-1, 1]."""
        df = build_features(_make_price_df())
        for col in ["day_of_week_sin", "day_of_week_cos", "month_sin", "month_cos"]:
            assert df[col].min() >= -1.0
            assert df[col].max() <= 1.0

    def test_moving_averages_not_nan(self):
        df = build_features(_make_price_df())
        assert not df["price_ma7"].isna().any()
        assert not df["price_ma14"].isna().any()

    def test_momentum_clipped(self):
        """Price momentum should be clipped to [-1, 1]."""
        df = build_features(_make_price_df())
        assert df["price_momentum"].min() >= -1.0
        assert df["price_momentum"].max() <= 1.0

    def test_volatility_non_negative(self):
        df = build_features(_make_price_df())
        assert (df["price_volatility_7"] >= 0).all()

    def test_sorts_by_date(self):
        """Output should be sorted by date regardless of input order."""
        raw = _make_price_df(30)
        shuffled = raw.sample(frac=1, random_state=42)
        df = build_features(shuffled)
        dates = df["date"].tolist()
        assert dates == sorted(dates)

    def test_full_columns_no_nan_in_features(self):
        """When all optional data is provided, no NaN in feature columns."""
        df = build_features(_make_full_df())
        for col in FEATURE_COLUMNS:
            assert not df[col].isna().any(), f"NaN found in {col}"


class TestCreateSequences:
    def test_output_shapes_with_targets(self):
        n, f = 100, 15
        features = np.random.randn(n, f).astype(np.float32)
        targets = np.random.randn(n, 3).astype(np.float32)
        X, y = create_sequences(features, targets, seq_length=SEQUENCE_LENGTH)

        expected_seqs = n - SEQUENCE_LENGTH
        assert X.shape == (expected_seqs, SEQUENCE_LENGTH, f)
        assert y.shape == (expected_seqs, 3)

    def test_output_shapes_without_targets(self):
        n, f = 100, 15
        features = np.random.randn(n, f).astype(np.float32)
        X, y = create_sequences(features, targets=None, seq_length=SEQUENCE_LENGTH)

        expected_seqs = n - SEQUENCE_LENGTH
        assert X.shape == (expected_seqs, SEQUENCE_LENGTH, f)
        assert y is None

    def test_sequence_content_correct(self):
        """First sequence should be features[0:seq_len], target should be targets[seq_len]."""
        features = np.arange(50 * 3).reshape(50, 3).astype(np.float32)
        targets = np.arange(50 * 2).reshape(50, 2).astype(np.float32)
        sl = 10
        X, y = create_sequences(features, targets, seq_length=sl)

        np.testing.assert_array_equal(X[0], features[0:sl])
        np.testing.assert_array_equal(y[0], targets[sl])
        np.testing.assert_array_equal(X[1], features[1:sl + 1])
        np.testing.assert_array_equal(y[1], targets[sl + 1])

    def test_empty_when_not_enough_data(self):
        features = np.random.randn(SEQUENCE_LENGTH, 15).astype(np.float32)
        targets = np.random.randn(SEQUENCE_LENGTH, 3).astype(np.float32)
        X, y = create_sequences(features, targets, seq_length=SEQUENCE_LENGTH)
        assert len(X) == 0
        assert len(y) == 0

    def test_dtype_is_float32(self):
        features = np.random.randn(50, 5).astype(np.float64)
        targets = np.random.randn(50, 3).astype(np.float64)
        X, y = create_sequences(features, targets, seq_length=10)
        assert X.dtype == np.float32
        assert y.dtype == np.float32


class TestPriceScaler:
    def _make_scaler_df(self, n: int = 100):
        df = build_features(_make_full_df(n))
        return df

    def test_fit_transform_shapes(self):
        df = self._make_scaler_df()
        scaler = PriceScaler()
        features, targets = scaler.fit_transform(df)

        # Features should have 15 columns
        assert features.shape[1] == 15
        # Targets should have 3 columns (7d, 14d, 30d)
        assert targets.shape[1] == 3
        # Both should have same number of valid rows
        assert features.shape[0] == targets.shape[0]
        assert features.shape[0] > 0

    def test_features_scaled_0_1(self):
        """Scaled features should be approximately in [0, 1]."""
        df = self._make_scaler_df()
        scaler = PriceScaler()
        features, _ = scaler.fit_transform(df)

        assert features.min() >= -0.01  # allow tiny float precision
        assert features.max() <= 1.01

    def test_transform_features_only(self):
        df = self._make_scaler_df()
        scaler = PriceScaler()
        scaler.fit_transform(df)

        transformed = scaler.transform_features(df)
        assert transformed.shape == (len(df), 15)

    def test_inverse_transform_roundtrip(self):
        """inverse_transform(transform(x)) should approximately recover x."""
        df = self._make_scaler_df()
        scaler = PriceScaler()
        features, targets = scaler.fit_transform(df)

        recovered = scaler.inverse_transform_targets(targets)
        re_scaled = scaler.target_scaler.transform(recovered)
        np.testing.assert_allclose(re_scaled, targets, atol=1e-5)

    def test_valid_rows_exclude_tail(self):
        """Rows near the end of the dataset can't have 30-day future prices,
        so fit_transform should exclude them."""
        n = 100
        df = self._make_scaler_df(n)
        scaler = PriceScaler()
        features, targets = scaler.fit_transform(df)

        # At minimum, the last 30 rows can't have all 3 targets
        assert features.shape[0] < n
