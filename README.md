# Hourglass — GIF Compression & UI Upload Tool

A precision-focused GIF generator with a sleek mobile-inspired UI. Combines a Flask backend with a responsive JavaScript frontend to convert videos into optimised GIFs using a dynamic FPS model and real-time terminal log streaming.

---

## Key Features

- 🔁 Upload videos from file or live camera input (browser)
- 🎞️ Extracts and resizes frames for optimised GIF output
- 📉 Predicts final GIF size using a trained compression model
- 🧠 Auto-adjusts FPS if target size is exceeded
- 📊 Displays live terminal logs during processing
- 🧼 Clean folder handling and overwrite-safe temp management
- 🔁 Fully restartable UI without page refresh
- 🎵 Optional audio toggle and animation polish

---

## Project Structure

```
hourglass-lite/
├── app.py                        # Flask backend
├── main.py                       # Video-to-GIF logic
├── templates/
│   └── index.html                # UI structure
├── static/
│   ├── css/
│   │   └── style.css             # Styling (mobile mockup, console panel, etc.)
│   ├── js/
│   │   └── script.js             # All frontend logic and animations
│   ├── assets/
│   │   └── background.gif        # Optional animated pixel art (if used)
│   └── audio/
│       └── music.mp3             # Optional ambient track
├── utils/
│   ├── frame_extractor.py
│   ├── gif_encoder.py
│   └── model_updater.py
├── config/
│   └── model_coeffs.json
├── logs/
│   └── pipeline.log              # Real-time log streaming for frontend
├── videos/                       # Uploaded video files
├── images/
│   ├── temp/                     # Temporary frames
│   └── gif/                      # Final output GIFs
├── requirements.txt
└── README.md
```

---

## Getting Started

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the backend**
   ```bash
   python app.py
   ```

3. **Open the frontend**
   - Serve `index.html` via Live Server or similar
   - UI loads in a phone-style container and waits for input

4. **Upload a video**
   - Use folder or camera icons to upload from file or webcam

5. **Receive your GIF**
   - Output saved in `images/gif/` as `video_fps.gif`

---

## API Endpoints

- `POST /upload`  
  Accepts video files as form data, starts pipeline asynchronously

- `GET /logs`  
  Streams the last 50 lines from `logs/pipeline.log` for UI console

---

## Compression Model

```text
compression_ratio = max(0.08, -0.000236 * fps² + 0.016632 * fps - 0.096541)
```

- Model updates after every 5 GIFs
- Coefficients stored in `config/model_coeffs.json`
- Data logs in `logs/gif_data_log.csv`

**To reset:**
- Delete `gif_data_log.csv`
- Optionally overwrite `model_coeffs.json`

---

## Author

Developed by **Ceri Gittins**  
[LinkedIn →](https://www.linkedin.com/in/ceri-gittins)  
#careertransition #learningbybuilding #backenddevelopment
