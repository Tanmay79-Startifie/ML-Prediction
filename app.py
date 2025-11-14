from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from typing import Any, Dict
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

app = FastAPI(title="AI Customer Feedback Rating Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    BASE_DIR = Path(__file__).resolve().parent
    MODEL_PATH = BASE_DIR / "model.pkl"

    if not MODEL_PATH.exists():
        print(f"❌ model.pkl not found at {MODEL_PATH}")
        model = None
    else:
        model = joblib.load(MODEL_PATH)
        print(f"✅ Model loaded successfully from {MODEL_PATH}")

except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None


class InputText(BaseModel):
    text: str

def _map_sentiment_from_rating(rating: int) -> str:
    if rating >= 5:
        return "Highly Positive"
    elif rating == 4:
        return "Positive"
    elif rating == 3:
        return "Neutral"
    elif rating == 2:
        return "Negative"
    else:
        return "Highly Negative"

@app.get("/")
def read_root():
    return {
        "message": "AI Rating Predictor API is running successfully!",
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/predict")
def predict_rating(data: InputText) -> Dict[str, Any]:
    text = data.text
    if not model:
        return {
            "rating": 3,
            "confidence": 50,
            "sentiment": "Neutral",
            "error": "Model not available"
        }

    try:
        pred = model.predict([text])[0]
        rating = int(pred)
        confidence = 75.0
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba([text])[0]
            try:
                classes = list(model.classes_)
                idx = classes.index(pred)
                confidence = round(float(probs[idx]) * 100, 2)
            except Exception:
                confidence = round(float(probs.max()) * 100, 2)
        sentiment = _map_sentiment_from_rating(rating)
        print(f"Text: {text} → Rating: {rating}, Sentiment: {sentiment}")
        return {
            "rating": rating,
            "confidence": confidence,
            "sentiment": sentiment
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return {
            "rating": 3,
            "confidence": 60,
            "sentiment": "Neutral"
        }

if os.getenv("VERCEL") != "1":
    try:
        app.mount("/", StaticFiles(directory="website", html=True), name="website")
    except Exception as e:
        print(f"Static files not mounted: {e}")