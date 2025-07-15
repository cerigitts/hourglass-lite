# app.py
# flask backend for video upload, gif creation, and session-based log handling

from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from pathlib import Path
from werkzeug.utils import secure_filename
import subprocess
import threading
import uuid

app = Flask(__name__, static_folder="static")
CORS(app, resources={r"/*": {"origins": "*"}})

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "videos"
GIF_OUTPUT_FOLDER = BASE_DIR / "images" / "gif"
LOG_FOLDER = BASE_DIR / "logs"

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}

UPLOAD_FOLDER.mkdir(exist_ok=True)
GIF_OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
LOG_FOLDER.mkdir(parents=True, exist_ok=True)

@app.route("/")
def landing():
    return render_template("index.html")

@app.route("/index")
def index():
    return render_template("index.html")

@app.route("/images/gif/<filename>")
def serve_gif(filename):
    return send_from_directory(GIF_OUTPUT_FOLDER, filename)

@app.route("/download/<session_id>")
def download_gif(session_id):
    gif_filename = f"{session_id}.gif"
    gif_path = GIF_OUTPUT_FOLDER / gif_filename
    if not gif_path.exists():
        return "GIF not found", 404
    return send_from_directory(GIF_OUTPUT_FOLDER, gif_filename, as_attachment=True)

def allowed_file(filename):
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

def run_pipeline_async(session_id, filename):
    log_path = LOG_FOLDER / f"{session_id}.log"

    def target():
        with open(log_path, "w") as log_file:
            process = subprocess.Popen(
                ["python3", "main.py"],
                stdin=subprocess.PIPE,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                text=True
            )
            process.stdin.write(filename + "\n")
            process.stdin.flush()
            process.stdin.close()
            process.wait()

        # cleanup video after processing
        uploaded_file = UPLOAD_FOLDER / filename
        if uploaded_file.exists():
            uploaded_file.unlink()

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

    ext = Path(file.filename).suffix.lower()
    session_id = str(uuid.uuid4())
    saved_name = f"{session_id}"
    save_path = UPLOAD_FOLDER / saved_name

    try:
        file.save(save_path)
    except Exception as e:
        return jsonify({"error": "Save failed"}), 500

    run_pipeline_async(session_id, saved_name)
    return jsonify({"session_id": session_id, "message": "Upload successful, pipeline started"}), 200

@app.route("/logs/<session_id>", methods=["GET"])
def stream_logs(session_id):
    log_path = LOG_FOLDER / f"{session_id}.log"
    if not log_path.exists():
        return jsonify({"logs": []})

    with open(log_path, "r") as f:
        lines = f.readlines()[-50:]
    return jsonify({"logs": lines})

if __name__ == "__main__":
    app.run()

# Expose application for Elastic Beanstalk
application = app
