from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import os
import json
from PIL import Image
import webbrowser
import threading

# -------------------------------------------------
# 🔧 Setup
# -------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "../frontend")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})

MODEL_PATH = os.path.join(BASE_DIR, "plant_disease_model_final.h5")
CLASS_INDICES_PATH = os.path.join(BASE_DIR, "class_indices.json")
DISEASE_INFO_PATH = os.path.join(BASE_DIR, "plant_disease.json")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# -------------------------------------------------
# 🔹 Load model and metadata
# -------------------------------------------------
print("🔹 Loading model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("✅ Model loaded successfully!")

with open(CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)
class_names = list(class_indices.keys())

with open(DISEASE_INFO_PATH, "r") as f:
    disease_info = json.load(f)

# -------------------------------------------------
# 🔍 Helper function for prediction
# -------------------------------------------------
def predict_image(image_path):
    img = Image.open(image_path).convert("RGB")
    img = img.resize((128, 128))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    preds = model.predict(img_array)
    pred_idx = np.argmax(preds[0])
    predicted_label = class_names[pred_idx]
    confidence = float(np.max(preds[0]))

    info = next((d for d in disease_info if d["name"] == predicted_label), None)
    return {
        "predicted_class": predicted_label,
        "confidence": round(confidence * 100, 2),
        "cause": info["cause"] if info else "Unknown",
        "cure": info["cure"] if info else "No cure info found"
    }

# -------------------------------------------------
# 🌐 Routes
# -------------------------------------------------
@app.route("/")
def serve_frontend():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:path>")
def serve_static_files(path):
    return send_from_directory(FRONTEND_DIR, path)

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        result = predict_image(file_path)
        os.remove(file_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------
# 🚀 Run app (Single Browser Tab)
# -------------------------------------------------
if __name__ == "__main__":
    port = 5000
    url = f"http://127.0.0.1:{port}"

    def open_browser():
        webbrowser.open(url)

    # Prevent double browser open due to Flask reloader
    if not os.environ.get("WERKZEUG_RUN_MAIN"):
        threading.Timer(1.5, open_browser).start()

    print(f"🚀 Starting server at {url}")
    app.run(host="0.0.0.0", port=port, debug=True)
