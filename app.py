from flask import Flask, request, jsonify, render_template
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
        print("[upload] no 'video' in request.files")
        return jsonify({"error": "No video file provided"}), 400

    file = request.files["video"]
    if file.filename == "":
        print("[upload] empty filename")
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        print(f"[upload] unsupported file type: {file.filename}")
        return jsonify({"error": "Unsupported file type"}), 400

    ext = Path(file.filename).suffix.lower()
    session_id = str(uuid.uuid4())
    saved_name = f"{session_id}"
    save_path = UPLOAD_FOLDER / saved_name

    if not UPLOAD_FOLDER.exists():
        print("[upload] videos/ folder missing, creating it now...")
        UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    else:
        print("[upload] videos/ folder exists")

    print(f"[upload] trying to save: {file.filename}")
    print(f"[upload] saving to: {save_path.resolve()}")

    try:
        file.save(save_path)
        print("[upload] save succeeded.")
    except Exception as e:
        print(f"[upload] save FAILED: {e}")
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

# Removed debug=True for production deployment
if __name__ == "__main__":
    app.run()

# Expose application for Elastic Beanstalk
application = app
