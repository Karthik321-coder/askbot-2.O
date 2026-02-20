"""YOLOv8 fine-tuning script for water polo ball detection.

Usage:
    python training/train_detector.py \
        --data training/data/water_polo_balls.yaml \
        --epochs 100
"""

from __future__ import annotations

import argparse
import os
import shutil


def train(args: argparse.Namespace) -> None:
    from ultralytics import YOLO  # type: ignore[import-untyped]

    # Start from pre-trained YOLOv8-Nano
    model = YOLO(args.model)

    # Train
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.img_size,
        batch=args.batch_size,
        project="runs/detect",
        name="water_polo_ball",
        exist_ok=True,
    )

    # Export best weights
    best_path = os.path.join("runs", "detect", "water_polo_ball", "weights", "best.pt")
    dst = os.path.join("models", "ball_detector.pt")
    os.makedirs("models", exist_ok=True)
    if os.path.isfile(best_path):
        shutil.copy2(best_path, dst)
        print(f"Best weights exported to {dst}")
    else:
        print("Warning: best.pt not found — check training output")

    print("Training complete.")
    print(f"Results: {results}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train YOLOv8 ball detector")
    parser.add_argument("--data", required=True, help="Path to dataset YAML")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--img-size", type=int, default=640)
    parser.add_argument("--model", default="yolov8n.pt", help="Base model")
    args = parser.parse_args()
    train(args)


if __name__ == "__main__":
    main()
