# frame_extractor.py
# extract frames from a video file, with optional selection index control

import cv2
from pathlib import Path
import numpy as np

SUPPORTED_EXTS = [".mp4", ".mov", ".avi", ".mkv", ".webm"]

def extract_frames(video_name, videos_folder=Path("videos"), images_folder=Path("images"),
                   max_width=640, max_height=480, selected_indices=None):
    candidate = videos_folder / video_name
    if not candidate.exists():
        print(f"no video found for '{video_name}' in '{videos_folder}'")
        return None

    video_path = candidate
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        print("failed to open video.")
        return None

    orig_fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / orig_fps if orig_fps else 0
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)

    scale = min(max_width / width, max_height / height, 1)
    new_w, new_h = int(width * scale), int(height * scale)

    output_folder = images_folder / video_name
    output_folder.mkdir(parents=True, exist_ok=True)

    # remove old frames if re-extracting selected frames
    if selected_indices:
        for f in output_folder.glob("*.png"):
            f.unlink()

    frame_files = []
    idx = 0
    selected_set = set(selected_indices) if selected_indices else None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if (selected_set is None) or (idx in selected_set):
            resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
            out_path = output_folder / f"frame_{idx:05d}.png"
            cv2.imwrite(str(out_path), resized)
            frame_files.append(out_path)

        idx += 1

    cap.release()

    raw_size_mb = sum(f.stat().st_size for f in frame_files) / (1024 * 1024)

    return {
        "video_path": video_path,
        "orig_fps": orig_fps,
        "duration": duration,
        "frame_count": frame_count,
        "resolution": (new_w, new_h),
        "frame_files": frame_files,
        "output_folder": output_folder,
        "total_raw_size_mb": raw_size_mb
    }
