"""Tests for EggPriceLSTM model architecture and MC Dropout inference."""

import numpy as np
import torch
import pytest

from app.ml.model import EggPriceLSTM
from app.ml.predict import _enable_mc_dropout, CI_Z_SCORE, MC_DROPOUT_PASSES


class TestEggPriceLSTM:
    def test_forward_output_shape(self):
        """Output should be (batch, 3) for 3 horizons."""
        model = EggPriceLSTM()
        x = torch.randn(4, 30, 15)  # batch=4, seq=30, features=15
        out = model(x)
        assert out.shape == (4, 3)

    def test_single_sample(self):
        model = EggPriceLSTM()
        x = torch.randn(1, 30, 15)
        out = model(x)
        assert out.shape == (1, 3)

    def test_custom_input_size(self):
        model = EggPriceLSTM(input_size=10, num_horizons=5)
        x = torch.randn(2, 30, 10)
        out = model(x)
        assert out.shape == (2, 5)

    def test_custom_hidden_sizes(self):
        model = EggPriceLSTM(
            hidden_size_1=128,
            hidden_size_2=64,
            dense_size_1=64,
            dense_size_2=32,
        )
        x = torch.randn(2, 30, 15)
        out = model(x)
        assert out.shape == (2, 3)

    def test_variable_sequence_length(self):
        """Model should accept any sequence length, not just 30."""
        model = EggPriceLSTM()
        for seq_len in [10, 30, 60]:
            x = torch.randn(1, seq_len, 15)
            out = model(x)
            assert out.shape == (1, 3)

    def test_gradients_flow(self):
        """Ensure gradients flow through all parameters."""
        model = EggPriceLSTM()
        x = torch.randn(2, 30, 15)
        target = torch.randn(2, 3)

        out = model(x)
        loss = torch.nn.MSELoss()(out, target)
        loss.backward()

        for name, param in model.named_parameters():
            assert param.grad is not None, f"No gradient for {name}"
            assert not torch.all(param.grad == 0), f"Zero gradient for {name}"

    def test_parameter_count(self):
        """Verify model isn't unexpectedly large or small."""
        model = EggPriceLSTM()
        total_params = sum(p.numel() for p in model.parameters())
        # Rough sanity check: LSTM(15→64) + LSTM(64→32) + Dense layers
        # Should be in the range of ~30k-80k parameters
        assert 10_000 < total_params < 200_000

    def test_eval_mode_deterministic(self):
        """In eval mode (dropout disabled), same input should give same output."""
        model = EggPriceLSTM()
        model.eval()
        x = torch.randn(1, 30, 15)

        with torch.no_grad():
            out1 = model(x).clone()
            out2 = model(x).clone()

        torch.testing.assert_close(out1, out2)

    def test_output_finite(self):
        """No NaN or Inf in output."""
        model = EggPriceLSTM()
        x = torch.randn(4, 30, 15)
        out = model(x)
        assert torch.isfinite(out).all()


class TestMCDropout:
    def test_enable_mc_dropout_sets_train(self):
        """_enable_mc_dropout should set Dropout layers to train mode."""
        model = EggPriceLSTM()
        model.eval()

        # Verify dropout is in eval mode first
        for m in model.modules():
            if isinstance(m, torch.nn.Dropout):
                assert not m.training

        _enable_mc_dropout(model)

        # Now dropout should be in train mode
        for m in model.modules():
            if isinstance(m, torch.nn.Dropout):
                assert m.training

    def test_mc_dropout_produces_variance(self):
        """Multiple forward passes with MC Dropout should produce different outputs."""
        model = EggPriceLSTM(dropout=0.3)  # higher dropout for clearer variance
        model.eval()
        _enable_mc_dropout(model)

        x = torch.randn(1, 30, 15)
        outputs = []
        with torch.no_grad():
            for _ in range(20):
                out = model(x)
                outputs.append(out.numpy().flatten())

        outputs = np.array(outputs)  # (20, 3)
        stds = outputs.std(axis=0)
        # With dropout active, there should be non-trivial variance
        assert (stds > 0).any(), "MC Dropout should produce variance in outputs"

    def test_confidence_interval_math(self):
        """Verify CI calculation: mean ± z * std."""
        np.random.seed(42)
        preds = np.random.normal(loc=6000, scale=100, size=(MC_DROPOUT_PASSES, 3))

        mean = preds.mean(axis=0)
        std = preds.std(axis=0)
        lower = mean - CI_Z_SCORE * std
        upper = mean + CI_Z_SCORE * std

        # Lower should be less than mean, upper should be greater
        assert (lower < mean).all()
        assert (upper > mean).all()
        # CI width should be 2 * z * std
        expected_width = 2 * CI_Z_SCORE * std
        actual_width = upper - lower
        np.testing.assert_allclose(actual_width, expected_width, atol=1e-10)
