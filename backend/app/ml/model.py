import torch
import torch.nn as nn


class EggPriceLSTM(nn.Module):
    """Multi-horizon LSTM model for egg price prediction.

    Architecture (v2):
        Input (30 × 15)
        → LSTM(64 units) + Dropout(0.2)
        → LSTM(32 units) + Dropout(0.2)
        → Dense(32, ReLU)
        → Dense(16, ReLU)
        → Output (3 values: 7d, 14d, 30d predictions)
    """

    def __init__(
        self,
        input_size: int = 15,
        hidden_size_1: int = 64,
        hidden_size_2: int = 32,
        dense_size_1: int = 32,
        dense_size_2: int = 16,
        dropout: float = 0.2,
        num_horizons: int = 3,
    ):
        super().__init__()

        self.lstm1 = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size_1,
            batch_first=True,
        )
        self.dropout1 = nn.Dropout(dropout)

        self.lstm2 = nn.LSTM(
            input_size=hidden_size_1,
            hidden_size=hidden_size_2,
            batch_first=True,
        )
        self.dropout2 = nn.Dropout(dropout)

        self.fc1 = nn.Linear(hidden_size_2, dense_size_1)
        self.relu1 = nn.ReLU()
        self.fc2 = nn.Linear(dense_size_1, dense_size_2)
        self.relu2 = nn.ReLU()
        self.output = nn.Linear(dense_size_2, num_horizons)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, seq_len=30, input_size=15)

        Returns:
            predictions: (batch, 3) — [7d, 14d, 30d] predictions
        """
        # LSTM layer 1
        out, _ = self.lstm1(x)
        out = self.dropout1(out)

        # LSTM layer 2 — use full sequence from layer 1
        out, _ = self.lstm2(out)
        out = self.dropout2(out[:, -1, :])  # take last time step

        # Dense layers
        out = self.relu1(self.fc1(out))
        out = self.relu2(self.fc2(out))
        out = self.output(out)

        return out
