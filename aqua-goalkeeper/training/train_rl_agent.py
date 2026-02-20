"""Reinforcement-learning agent training for the goalkeeper decision policy.

Uses Proximal Policy Optimization (PPO) to train a policy network
in a simplified goalkeeper simulation environment.

Usage:
    python training/train_rl_agent.py --episodes 100000
"""

from __future__ import annotations

import argparse
import os
from typing import Tuple

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim


# -------------------------------------------------------------------
# Simple goalkeeper environment
# -------------------------------------------------------------------

class GoalkeeperEnv:
    """Simplified gymnasium-style environment for goalkeeper training.

    State (6,):
        [ball_impact_x_norm, ball_impact_y_norm, time_to_impact,
         shot_confidence, paddle_x_norm, paddle_y_norm]

    Action (2,):
        [target_x_norm, target_y_norm]  (continuous, 0–1)

    Reward:
        +1 if paddle is within catch_radius of impact point
        -1 otherwise
        small penalty proportional to distance traveled
    """

    GOAL_WIDTH = 3.0
    GOAL_HEIGHT = 0.9
    PADDLE_SPEED = 4.0  # m/s
    CATCH_RADIUS = 0.35  # meters — paddle half-width approximation

    def __init__(self) -> None:
        self.rng = np.random.default_rng()
        self.paddle_x = 0.5  # normalized
        self.paddle_y = 0.5

    def reset(self) -> np.ndarray:
        self.paddle_x = 0.5
        self.paddle_y = 0.5
        return self._make_state()

    def step(self, action: np.ndarray) -> Tuple[np.ndarray, float, bool]:
        target_x = float(np.clip(action[0], 0, 1))
        target_y = float(np.clip(action[1], 0, 1))

        # Simulate paddle movement
        dist = np.sqrt((target_x - self.paddle_x) ** 2 + (target_y - self.paddle_y) ** 2)
        self.paddle_x = target_x
        self.paddle_y = target_y

        # Check if paddle blocks the ball
        impact_x = self._impact_x
        impact_y = self._impact_y
        dx = (self.paddle_x - impact_x) * self.GOAL_WIDTH
        dy = (self.paddle_y - impact_y) * self.GOAL_HEIGHT
        distance = np.sqrt(dx ** 2 + dy ** 2)

        blocked = distance < self.CATCH_RADIUS
        reward = 1.0 if blocked else -1.0
        reward -= 0.1 * dist  # Small penalty for movement

        return self._make_state(), float(reward), True  # Episode is single-step

    def _make_state(self) -> np.ndarray:
        self._impact_x = self.rng.uniform(0, 1)
        self._impact_y = self.rng.uniform(0, 1)
        time_to_impact = self.rng.uniform(0.1, 0.8)
        confidence = self.rng.uniform(0.5, 1.0)
        return np.array(
            [self._impact_x, self._impact_y, time_to_impact, confidence, self.paddle_x, self.paddle_y],
            dtype=np.float32,
        )


# -------------------------------------------------------------------
# Policy network
# -------------------------------------------------------------------

class PolicyNetwork(nn.Module):
    def __init__(self, state_dim: int = 6, action_dim: int = 2, hidden: Tuple[int, ...] = (256, 128, 64)) -> None:
        super().__init__()
        layers = []
        prev = state_dim
        for h in hidden:
            layers.append(nn.Linear(prev, h))
            layers.append(nn.ReLU())
            prev = h
        layers.append(nn.Linear(prev, action_dim))
        layers.append(nn.Sigmoid())  # Output in [0, 1]
        self.net = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


# -------------------------------------------------------------------
# Training (simplified PPO-style)
# -------------------------------------------------------------------

def train(args: argparse.Namespace) -> None:
    env = GoalkeeperEnv()

    hidden_layers = tuple(args.hidden_layers) if args.hidden_layers else (256, 128, 64)
    policy = PolicyNetwork(state_dim=6, action_dim=2, hidden=hidden_layers)
    optimizer = optim.Adam(policy.parameters(), lr=args.lr)

    total_reward = 0.0
    recent_rewards = []

    for episode in range(1, args.episodes + 1):
        state = env.reset()
        state_t = torch.tensor(state, dtype=torch.float32).unsqueeze(0)

        action = policy(state_t).squeeze(0)
        action_np = action.detach().numpy()

        _, reward, _ = env.step(action_np)

        # Simple policy gradient update
        loss = -reward * torch.log(action.sum() + 1e-8)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_reward += reward
        recent_rewards.append(reward)
        if len(recent_rewards) > 1000:
            recent_rewards.pop(0)

        if episode % 10000 == 0:
            mean_recent = np.mean(recent_rewards)
            print(f"Episode {episode}/{args.episodes}  Mean reward (last 1k): {mean_recent:.3f}")

    # Export as TorchScript
    os.makedirs("models", exist_ok=True)
    scripted = torch.jit.script(policy)
    dst = os.path.join("models", "rl_agent.pt")
    scripted.save(dst)
    print(f"Policy saved to {dst}")
    print(f"Final mean reward (last 1k): {np.mean(recent_rewards):.3f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train RL goalkeeper agent")
    parser.add_argument("--episodes", type=int, default=100000)
    parser.add_argument("--lr", type=float, default=0.0003)
    parser.add_argument("--gamma", type=float, default=0.99)
    parser.add_argument("--batch-size", type=int, default=2048)
    parser.add_argument("--hidden-layers", type=int, nargs="+", default=[256, 128, 64])
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
