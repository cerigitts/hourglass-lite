# gif_encoder.py
# create gif from a list of frame files with controlled color palette

from PIL import Image
from pathlib import Path

def create_gif_from_frames(frames_folder: Path, video_name: str, frame_files, fps: float, output_path: Path):
    images = []
    for f in frame_files:
        img = Image.open(f).convert("P", palette=Image.ADAPTIVE, colors=64)
        images.append(img)

    duration = int(1000 / fps)

    images[0].save(
        output_path,
        save_all=True,
        append_images=images[1:],
        duration=duration,
        loop=0,
        optimize=True,
        disposal=1,
        dither=Image.NONE
    )
