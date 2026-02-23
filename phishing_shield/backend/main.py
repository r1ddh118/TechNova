import sys
import joblib
import numpy as np
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

# 1. Path Fix - Ensuring backend is in the python path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# 2. Imports from Member 3's engine
try:
    from backend.nlp_engine.feature_extractor import extract_features, to_vector
except ImportError as e:
    print(f" Import Error: {e}")

app = FastAPI(title="TechNova Phishing Shield API")

# 3. CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Global Model Loading
MODEL_PATH = Path(__file__).resolve().parent / "model" / "model.joblib"
model = None
EXPECTED_FEATURES = 12  # Your model was trained with 12

try:
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
        # Check if model has a feature count attribute
        if hasattr(model, 'n_features_in_'):
            EXPECTED_FEATURES = model.n_features_in_
        print(f" Model loaded! Expecting {EXPECTED_FEATURES} features.")
    else:
        print(f"Model not found at {MODEL_PATH}")
except Exception as e:
    print(f" Error loading model: {e}")

# 5. Helper Function to Align Features
def align_features(vector, expected_count):
    """Ensures the vector length matches what the model expects."""
    current_len = len(vector)
    if current_len == expected_count:
        return vector
    elif current_len < expected_count:
        # Pad with zeros if features are missing
        return np.pad(vector, (0, expected_count - current_len), 'constant')
    else:
        # Truncate if there are extra features
        return vector[:expected_count]

# 6. Data Models
class ScanRequest(BaseModel):
    text: str

class BatchScanRequest(BaseModel):
    texts: List[str]

# --- ENDPOINTS ---

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "model_loaded": model is not None,
        "expected_features": EXPECTED_FEATURES,
        "api_version": "1.1.0"
    }

@app.post("/scan")
async def scan_single(request: ScanRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        features_dict = extract_features(request.text)
        vector = to_vector(features_dict)
        
        # FEATURE ALIGNMENT STEP
        final_vector = align_features(vector, EXPECTED_FEATURES)
        
        prediction = model.predict([final_vector])[0]
        probability = model.predict_proba([final_vector])[0][1]

        return {
            "is_phishing": bool(prediction),
            "confidence": round(float(probability), 4),
            "risk_level": "High" if probability > 0.7 else "Medium" if probability > 0.3 else "Low",
            "explanations": features_dict.get('explanations', ["Analysis complete"])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/batch-scan")
async def scan_batch(request: BatchScanRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    results = []
    try:
        for text in request.texts:
            f_dict = extract_features(text)
            vec = align_features(to_vector(f_dict), EXPECTED_FEATURES)
            
            prob = model.predict_proba([vec])[0][1]
            
            results.append({
                "text_preview": text[:50] + "...",
                "is_phishing": bool(model.predict([vec])[0]),
                "confidence": round(float(prob), 4),
                "risk_level": "High" if prob > 0.7 else "Medium" if prob > 0.3 else "Low"
            })
        
        return {"batch_results": results, "total_scanned": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch error: {str(e)}")