import shutil
import numpy as np
import os
import json
import csv
import subprocess
import sys
from pathlib import Path
from utils.frame_extractor import extract_frames
from utils.gif_encoder import create_gif_from_frames

import functools
print = functools.partial(print, flush=True)

CONFIG_PATH = Path("config/model_coeffs.json")
LOG_PATH = Path("logs/gif_data_log.csv")
TRACKER_PATH = Path("logs/last_update.txt")

GIF_OUTPUT_FOLDER = Path("images/gif")
MAX_FPS = 50
MAX_GIF_SIZE_MB = 20
UPDATE_THRESHOLD = 5
DEBUG = False

def dbg(msg):
    if DEBUG:
        print(f"[main] {msg}")

def load_model_coefficients(config_path=CONFIG_PATH):
    if config_path.exists():
        with open(config_path, "r") as f:
            coeffs = json.load(f)
        return coeffs.get("a"), coeffs.get("b"), coeffs.get("c")
    else:
        return -0.0003, 0.0206, -0.1406

def estimate_compression_ratio(fps, a, b, c):
    return max(0.08, a * fps ** 2 + b * fps + c)

def estimate_gif_size(raw_size_mb, fps, a, b, c):
    return raw_size_mb * estimate_compression_ratio(fps, a, b, c)

def log_gif_data(video_name, fps, raw_size_mb, actual_size_mb):
    LOG_PATH.parent.mkdir(exist_ok=True)
    exists = LOG_PATH.exists()
    with open(LOG_PATH, mode='a', newline='') as f:
        writer = csv.writer(f)
        if not exists:
            writer.writerow(["video_name", "fps", "raw_size_mb", "actual_size_mb"])
        writer.writerow([video_name, fps, raw_size_mb, actual_size_mb])

def calculate_max_fps(raw_size_mb, a, b, c):
    for fps in range(MAX_FPS, 0, -1):
        if estimate_gif_size(raw_size_mb, fps, a, b, c) <= MAX_GIF_SIZE_MB:
            return fps
    return 1

def should_update_model():
    if not TRACKER_PATH.exists():
        return True
    with open(TRACKER_PATH, "r") as f:
        try:
            last = int(f.read().strip())
        except ValueError:
            return True
    if not LOG_PATH.exists():
        return False
    current = sum(1 for _ in open(LOG_PATH))
    return (current - last) >= UPDATE_THRESHOLD

def update_tracker():
    current = sum(1 for _ in open(LOG_PATH))
    with open(TRACKER_PATH, "w") as f:
        f.write(str(current))

def run_pipeline():
    if len(sys.argv) != 3:
        print("Usage: python3 main.py <session_id> <filename>")
        sys.exit(1)

    session_id = sys.argv[1]
    filename = sys.argv[2]

    temp_images_folder = Path("images") / "temp" / session_id
    temp_images_folder.mkdir(parents=True, exist_ok=True)
    GIF_OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)

    # Determine videos folder path
    videos_folder = Path("videos")

    info = extract_frames(
        filename,
        images_folder=temp_images_folder,
        videos_folder=videos_folder
    )

    if not info:
        print("Failed to extract frames.")
        return

    a, b, c = load_model_coefficients()
    orig_fps = info["orig_fps"]
    raw_size_mb = info["total_raw_size_mb"]

    print(f"\nvideo duration: {info['duration']:.2f}s, original fps: {orig_fps:.2f}")
    print(f"resolution scaled to: {info['resolution'][0]}×{info['resolution'][1]}")
    print(f"extracted {info['frame_count']} frames")
    print(f"total size of extracted frames: {raw_size_mb:.2f} mb")

    target_fps = min(orig_fps, MAX_FPS)
    est_size = estimate_gif_size(raw_size_mb, target_fps, a, b, c)

    if est_size > MAX_GIF_SIZE_MB:
        max_fps = calculate_max_fps(raw_size_mb, a, b, c)
        print(f"\nestimated gif size at {int(target_fps)} fps: {est_size:.2f} mb (exceeds limit)")
        print(f"suggested max fps to meet size limit: {max_fps}")
        print(f"creating gif at {max_fps} fps...")
        target_fps = max_fps
    else:
        print(f"\nestimated gif size at {int(target_fps)} fps: {est_size:.2f} mb (within limit)")

    # Clear any previous temp for this session
    if temp_images_folder.exists():
        shutil.rmtree(temp_images_folder)
    temp_images_folder.mkdir(parents=True, exist_ok=True)

    selected = list(np.linspace(
        0, info["frame_count"] - 1,
        int(round(info["duration"] * target_fps)),
        dtype=int
    ))

    info = extract_frames(
        filename,
        images_folder=temp_images_folder,
        selected_indices=selected,
        videos_folder=videos_folder
    )

    print(f"expected frames: {len(selected)}")
    print(f"actual extracted: {len(info['frame_files'])}")

    if not info:
        print("No frames extracted in second pass.")
        return

    gif_path = GIF_OUTPUT_FOLDER / f"{session_id}.gif"

    create_gif_from_frames(
        temp_images_folder,
        session_id,
        info["frame_files"],
        target_fps,
        output_path=gif_path
    )

    actual_size_mb = os.path.getsize(gif_path) / (1024 * 1024)
    print(f"actual gif size: {actual_size_mb:.2f} mb")

    log_gif_data(session_id, target_fps, raw_size_mb, actual_size_mb)

    if should_update_model():
        print("triggering model updater...")
        subprocess.run([sys.executable, "utils/model_updater.py"])
        update_tracker()

    if temp_images_folder.exists():
        shutil.rmtree(temp_images_folder)

if __name__ == "__main__":
    run_pipeline()
