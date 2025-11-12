from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
from typing import Any, Dict
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# ✅ Allow frontend to access backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load model
try:
    model = joblib.load("model.pkl")
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
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
    return {
        "message": "AI Rating Predictor API is running!",
        "status": "healthy",
        "model_loaded": model is not None
    }

@app.post("/predict")
def predict_rating(data: InputText) -> Dict[str, Any]:
    text = data.text

    if not model:
        return {"rating": 3, "confidence": 50, "sentiment": "Neutral"}

    try:
        pred = model.predict([text])[0]
        rating = int(pred)
        confidence = 90  # You can later calculate based on predict_proba
    except Exception as e:
        print(f"Prediction error: {e}")
        rating = 3
        confidence = 60

    sentiment = _map_sentiment_from_rating(rating)

    return {
        "rating": rating,
        "confidence": confidence,
        "sentiment": sentiment
    }

# ✅ Serve static website only in local (not needed on Railway)
if os.getenv("VERCEL") != "1":
    try:
        app.mount("/", StaticFiles(directory="website", html=True), name="website")
    except Exception as e:
        print(f"Static files not mounted: {e}")