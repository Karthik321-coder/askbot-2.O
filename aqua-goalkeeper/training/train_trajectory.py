"""LSTM trajectory predictor training script.

Trains a 2-layer LSTM to predict ball impact point from a sequence
of 3D position observations.

Usage:
    python training/train_trajectory.py \
        --data training/data/trajectories.csv \
        --epochs 200
"""

from __future__ import annotations

import argparse
import os

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset


# -------------------------------------------------------------------
# Model
# -------------------------------------------------------------------

class TrajectoryLSTM(nn.Module):
    """LSTM that predicts (impact_x, impact_y, time_to_impact) from
    a sequence of (x, y, z, dt) observations."""

    def __init__(self, input_size: int = 4, hidden_size: int = 128, num_layers: int = 2, output_size: int = 3) -> None:
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, seq_len, input_size)
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])  # Use last time step
        return out


# -------------------------------------------------------------------
# Dataset
# -------------------------------------------------------------------

class TrajectoryDataset(Dataset):
    """Loads trajectory sequences from a CSV file.

    Expected CSV columns: trajectory_id, step, x, y, z, timestamp, target_x, target_y, time_to_impact
    """

    def __init__(self, csv_path: str, sequence_length: int = 10) -> None:
        data = np.loadtxt(csv_path, delimiter=",", skiprows=1)
        self.sequences = []
        self.targets = []

        # Group by trajectory_id (column 0)
        traj_ids = np.unique(data[:, 0].astype(int))
        for tid in traj_ids:
            rows = data[data[:, 0] == tid]
            rows = rows[rows[:, 1].argsort()]  # sort by step

            if len(rows) < sequence_length:
                continue

            # Input: (x, y, z, dt)
            t0 = rows[0, 5]
            seq = np.column_stack([rows[:sequence_length, 2:5], rows[:sequence_length, 5] - t0]).astype(np.float32)

            # Target: (target_x, target_y, time_to_impact)
            target = rows[0, 6:9].astype(np.float32)

            self.sequences.append(seq)
            self.targets.append(target)

    def __len__(self) -> int:
        return len(self.sequences)

    def __getitem__(self, idx: int):
        return torch.tensor(self.sequences[idx]), torch.tensor(self.targets[idx])


# -------------------------------------------------------------------
# Training loop
# -------------------------------------------------------------------

def train(args: argparse.Namespace) -> None:
    dataset = TrajectoryDataset(args.data, args.sequence_length)
    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True)

    model = TrajectoryLSTM(
        input_size=4,
        hidden_size=args.hidden_size,
        num_layers=2,
        output_size=3,
    )

    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)

    print(f"Training on {len(dataset)} sequences for {args.epochs} epochs")

    for epoch in range(1, args.epochs + 1):
        total_loss = 0.0
        for seq_batch, target_batch in loader:
            optimizer.zero_grad()
            pred = model(seq_batch)
            loss = criterion(pred, target_batch)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * seq_batch.size(0)

        avg_loss = total_loss / len(dataset)
        if epoch % 10 == 0 or epoch == 1:
            print(f"Epoch {epoch}/{args.epochs}  Loss: {avg_loss:.6f}")

    # Export as TorchScript
    os.makedirs("models", exist_ok=True)
    scripted = torch.jit.script(model)
    dst = os.path.join("models", "trajectory_lstm.pt")
    scripted.save(dst)
    print(f"Model saved to {dst}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train trajectory LSTM predictor")
    parser.add_argument("--data", required=True, help="Path to trajectories CSV")
    parser.add_argument("--epochs", type=int, default=200)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--hidden-size", type=int, default=128)
    parser.add_argument("--sequence-length", type=int, default=10)
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
