from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from werkzeug.utils import secure_filename
import subprocess
import threading

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = Path(__file__).resolve().parent / "videos"
GIF_OUTPUT_FOLDER = Path(__file__).resolve().parent / "images" / "gif"
LOG_FILE = Path(__file__).resolve().parent / "logs" / "pipeline.log"
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

UPLOAD_FOLDER.mkdir(exist_ok=True)
GIF_OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

def allowed_file(filename):
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

def run_pipeline_async(video_name):
    if LOG_FILE.exists():
        LOG_FILE.unlink()

    def target():
        with open(LOG_FILE, "w") as log_file:
            process = subprocess.Popen(
                ["/Users/cerigittins/Documents/GitHub/hourglass-lite/venv/bin/python", "main.py"],
                stdin=subprocess.PIPE,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                text=True
            )
            process.stdin.write(video_name + "\n")
            process.stdin.flush()
            process.stdin.close()
            process.wait()

        for ext in ALLOWED_EXTENSIONS:
            uploaded_file = UPLOAD_FOLDER / f"{video_name}{ext}"
            if uploaded_file.exists():
                uploaded_file.unlink()
                break

    thread = threading.Thread(target=target)
    thread.start()

@app.route("/upload", methods=["POST"])
def upload_video():
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    file = request.files["video"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    filename = secure_filename(file.filename)
    save_path = UPLOAD_FOLDER / filename
    file.save(save_path)

    video_name = Path(filename).stem
    run_pipeline_async(video_name)

    return jsonify({"message": "Upload successful, pipeline started"}), 200

@app.route("/logs", methods=["GET"])
def stream_logs():
    if not LOG_FILE.exists():
        return jsonify({"logs": []})

    with open(LOG_FILE, "r") as f:
        lines = f.readlines()[-50:]
    return jsonify({"logs": lines})

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
