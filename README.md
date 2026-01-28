# Offline-First AI Phishing Shield

A minimal backend for an offline-capable phishing intelligence engine suitable for constrained/air-gapped field deployments (emails, SMS, internal chat).

Quick start (run from the project root directory containing `backend/` and `data/`)

1) Create & activate virtualenv

    python3 -m venv .venv
    source .venv/bin/activate

2) Install dependencies

    pip install -r requirements.txt

3) Generate features from the provided dummy dataset

    python -m backend.scripts.generate_features

   This produces:
    - `data/features.csv`       # explainable numeric features
    - `data/features.npz`       # sparse TF-IDF + numeric feature matrix
    - `backend/model/vectorizer.joblib`  # saved vectorizer

4) Bootstrap a dummy model (optional)

    python backend/model/train_dummy_model.py

   This writes `backend/model/phishing_model.pkl` used by the API.

5) Run the API

    uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000

   If port 8000 is in use (Docker/Portainer often binds it), choose a different port e.g. `--port 8001`.

6) Test the endpoint

    curl -s -X POST "http://127.0.0.1:8000/scan" \
      -H "Content-Type: application/json" \
      -d '{"text":"URGENT: Your bank account is suspended! Verify immediately http://fakebank-login123.com"}' | python -m json.tool

What the project contains
- `backend/` - FastAPI app and NLP engine (`nlp_engine/`) including preprocessors and feature extractor
- `backend/model/` - models and saved vectorizer artifacts
- `backend/scripts/generate_features.py` - compute TF-IDF + engineered features from `data/dummy_data.csv`
- `data/` - sample datasets and generated feature artifacts

Notes & troubleshooting
- Always run commands from the repository root so package imports (e.g. `backend.nlp_engine`) resolve.
- `tldextract` may download the public suffix list on first run (network required). Run once on a connected host to cache it for offline use.
- If you get "Address already in use" when running uvicorn, either stop the process/container using the port or run on another port.
- Generated artifacts and virtualenv are gitignored by `.gitignore`.

Next steps
- Expand the dummy dataset, add realistic obfuscation and spear-phishing samples.
- Add a proper training pipeline that persists a vectorizer + model and evaluation metrics.
- Add unit tests for detectors (`url_analyzer`, `urgency_detector`, `impersonation_detector`) and CI.

Contact / Contribution
- This repository is a starting point for the Member 4 (NLP & Feature Engineering) module — extend the `backend/nlp_engine` detectors and the feature pipeline in `backend/nlp_engine/vectorizer.py`.
