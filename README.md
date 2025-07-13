# Hourglass — GIF Compression Tool

A precision-focused GIF generator built in Python. Extracts frames from video, estimates final size, and creates optimised GIFs with a dynamic FPS model based on compression efficiency.

---

## Key Features

- Extracts and resizes frames from video
- Predicts GIF file size using a trained quadratic model
- Automatically selects optimal FPS if target size is exceeded
- Logs performance and retrains the model based on usage
- Clean folder handling and overwrite-safe temp management

---

## Project Structure

```
hourglass/
├── main.py
├── utils/
│   ├── frame_extractor.py
│   ├── gif_encoder.py
│   └── model_updater.py
├── config/
│   └── model_coeffs.json
├── logs/
│   └── gif_data_log.csv
├── videos/
├── images/
│   ├── temp/
│   └── gif/
```

---

## Getting Started

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the tool:
   ```
   python main.py
   ```

3. Input video:  
   Place files in the `videos/` folder  
   Supported formats: .mp4, .mov, .avi, .mkv, .webm

4. Output GIF:  
   Created in `images/gif/`  
   File is named as `video_fps.gif`

---

## Compression Model

Default compression ratio estimate:

```
compression_ratio = max(0.08, -0.000236 * fps² + 0.016632 * fps - 0.096541)
```

- Model learns from actual GIF results over time
- Automatically retrains after 5 entries in `gif_data_log.csv`
- Can be manually edited via `config/model_coeffs.json`

---

## Resetting the Tool

To reset:
- Delete `logs/gif_data_log.csv` to clear history
- Manually overwrite the model file if needed

---

## Author

Developed by Ceri Gittins  
LinkedIn: https://www.linkedin.com/in/ceri-gittins  
#careertransition #learningbybuilding #backenddevelopment
