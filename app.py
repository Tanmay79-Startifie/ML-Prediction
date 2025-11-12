from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from typing import Any, Dict
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Allow cross-origin requests (production-ready CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Vercel deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model with error handling
try:
    model = joblib.load("model.pkl")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None


class InputText(BaseModel):
    text: str


def _map_sentiment_from_rating(rating: int) -> str:
    if rating >= 5:
        return "Highly Positive"
    if rating == 4:
        return "Positive"
    if rating == 3:
        return "Neutral"
    if rating == 2:
        return "Negative"
    return "Highly Negative"


@app.get("/")
def read_root():
    """Root endpoint - health check"""
    return {
        "message": "AI Rating Predictor API is running!",
        "status": "healthy",
        "model_loaded": model is not None
    }


@app.post("/predict")
def predict_rating(data: InputText) -> Dict[str, Any]:
    text = data.text

    # Check if model is loaded
    if not model:
        return {
            "rating": 3,
            "confidence": 50.0,
            "sentiment": "Neutral",
            "error": "Model not available"
        }

    # Predict label
    try:
        pred = model.predict([text])[0]
        rating = int(pred)
    except Exception:
        # Fallback if model prediction fails
        rating = 3

    # Compute confidence if model supports predict_proba
    confidence = None
    try:
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba([text])[0]
            # Try to find the index corresponding to predicted class
            try:
                classes = list(model.classes_)
                idx = classes.index(pred)
            except Exception:
                # If classes are not directly matching, pick max prob
                idx = int(probs.argmax())
            confidence = round(float(probs[idx]) * 100, 2)
        else:
            confidence = 75.0
    except Exception:
        confidence = 75.0

    sentiment = _map_sentiment_from_rating(rating)

    return {
        "rating": rating,
        "confidence": confidence,
        "sentiment": sentiment,
    }


# Mount static files only in local development (not on Vercel)
if os.getenv("VERCEL") != "1":
    try:
        app.mount("/", StaticFiles(directory="website", html=True), name="website")
    except Exception as e:
        print(f"Static files not mounted: {e}")

