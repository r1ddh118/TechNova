# Task Status Snapshot

## Completed in this update
- Backend API hardening with `GET /health`, `POST /scan`, `POST /batch-scan`.
- Added model + vectorizer loading support (`model.joblib`, `vectorizer.joblib`).
- Added structured validation and inference error handling.
- Added CORS for frontend integration.
- Added hybrid scoring (ML confidence + rule score with override rules).
- Added audit logging into SQLite (`audit_logs`).
- Added credential storage endpoints with Google-account support (`/credentials`) with hashed password storage.
- Improved training pipeline for model comparison/tuning (Logistic Regression + Random Forest), metric export, and risk-threshold metadata.

## Remaining work by member area

### Member 1 (Backend API & Integration)
- Postman collection/export is still pending (manual API tests were run via local Python checks).
- End-to-end run with final trained `model.joblib` + `vectorizer.joblib` in target deployment environment is pending.

### Member 2 (Model Training & Optimization)
- XGBoost experiment is optional and still pending.
- Full benchmark report across all candidate models on the final curated feature set is pending.

### Member 3 (NLP & Detection Intelligence)
- Core requested detections are implemented (IP URLs, shorteners, suspicious subdomains, credential keywords, domain lookalikes).
- Optional SHAP workflow is present in code but not wired into a runtime report endpoint.

### Member 4 (Frontend Integration & Offline PWA)
- API wiring for scan/history/export UI and offline IndexedDB dashboard still needs frontend-side implementation/testing.

### Member 5 (Security Layer & Hybrid Rule Engine)
- Hybrid scoring + override rules + audit persistence are implemented.
- Exportable report generator and role-mode behavior (`field` vs `analyst`) remain to be implemented.
