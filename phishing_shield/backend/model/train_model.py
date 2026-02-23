from pathlib import Path
from time import perf_counter

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import GridSearchCV, train_test_split


def _metrics(y_true, y_pred, y_prob):
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision": round(precision_score(y_true, y_pred), 4),
        "recall": round(recall_score(y_true, y_pred), 4),
        "f1": round(f1_score(y_true, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_true, y_prob), 4),
    }


def _risk_thresholds(proba: float) -> str:
    if proba >= 0.75:
        return "High"
    if proba >= 0.40:
        return "Medium"
    return "Low"


def train():
    root = Path(__file__).resolve().parents[2]
    data_path = root / "data" / "features.csv"
    model_save_path = Path(__file__).resolve().parent / "model.joblib"
    metrics_save_path = Path(__file__).resolve().parent / "model_metrics.joblib"

    df = pd.read_csv(data_path, low_memory=False)
    df = df.dropna(subset=["label"])

    label_map = {"legitimate": 0, "phishing": 1}
    y = df["label"].astype(str).str.lower().map(label_map)
    mask = y.notnull()
    y = y[mask].astype(int)

    X = df.loc[mask].select_dtypes(include=["number"]).copy()
    if "label" in X.columns:
        X = X.drop(columns=["label"])
    X = X.fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    candidates = {
        "logistic_regression": (
            LogisticRegression(max_iter=2000),
            {"C": [0.1, 1.0, 5.0]},
        ),
        "random_forest": (
            RandomForestClassifier(random_state=42),
            {"n_estimators": [100, 200], "max_depth": [None, 15]},
        ),
    }

    best_name = None
    best_model = None
    best_score = -1.0
    all_metrics = {}

    for name, (base_model, grid) in candidates.items():
        search = GridSearchCV(base_model, grid, scoring="f1", cv=3, n_jobs=-1)
        search.fit(X_train, y_train)

        model = search.best_estimator_
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        m = _metrics(y_test, y_pred, y_prob)
        m["best_params"] = search.best_params_
        all_metrics[name] = m

        if m["f1"] > best_score:
            best_score = m["f1"]
            best_name = name
            best_model = model

    t0 = perf_counter()
    _ = best_model.predict(X_test.iloc[: min(50, len(X_test))])
    inference_ms = (perf_counter() - t0) * 1000

    sample_thresholds = {
        "low": _risk_thresholds(0.2),
        "medium": _risk_thresholds(0.5),
        "high": _risk_thresholds(0.9),
    }

    joblib.dump(best_model, model_save_path)
    joblib.dump(
        {
            "best_model": best_name,
            "metrics": all_metrics,
            "inference_ms_for_50_samples": round(inference_ms, 3),
            "risk_thresholds": sample_thresholds,
        },
        metrics_save_path,
    )

    print(f"Saved best model ({best_name}) to {model_save_path}")
    print(f"Saved model metrics to {metrics_save_path}")


if __name__ == "__main__":
    train()
