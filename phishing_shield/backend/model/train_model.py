from pathlib import Path
from time import perf_counter
import sys
import pickle

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier, GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression, PassiveAggressiveClassifier, Perceptron, SGDClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier


def _metrics(y_true, y_pred, y_prob):
    return {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision": round(precision_score(y_true, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_true, y_pred, zero_division=0), 4),
        "f1": round(f1_score(y_true, y_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_true, y_prob), 4),
    }


def _risk_thresholds(proba: float) -> str:
    if proba >= HIGH_RISK_MIN:
        return "High"
    if proba >= LOW_RISK_MAX:
        return "Medium"
    return "Low"


def _severity_bucket(probability: float) -> str:
    if probability >= 0.8:
        return "high"
    if probability >= 0.5:
        return "low"
    return "safe"


def _to_prob(model, X):
    if hasattr(model, "predict_proba"):
        return model.predict_proba(X)[:, 1]
    decision = model.decision_function(X)
    return (decision - decision.min()) / max(decision.max() - decision.min(), 1e-8)


def _load_features_dataset(root: Path) -> pd.DataFrame:
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

    data_path = root / "data" / "features.csv"
    if not data_path.exists():
        from backend.nlp_engine.generate_features import main as generate_features_main

        print("features.csv not found. Generating from available source datasets...")
        generate_features_main()

    if not data_path.exists():
        raise RuntimeError("features.csv is required for training but could not be generated")

    df = pd.read_csv(data_path, low_memory=False)
    if len(df) > 12000:
        df = df.sample(n=12000, random_state=42)
    return df


def train():
    root = Path(__file__).resolve().parents[2]
    model_save_path = Path(__file__).resolve().parent / "model.joblib"
    pickle_save_path = Path(__file__).resolve().parent / "model.pkl"
    metrics_save_path = Path(__file__).resolve().parent / "model_metrics.joblib"

    df = _load_features_dataset(root)

    df = df.dropna(subset=["label"])

    label_map = {
        "legitimate": 0,
        "legit": 0,
        "safe": 0,
        "0": 0,
        "0.0": 0,
        "phishing": 1,
        "phish": 1,
        "1": 1,
        "1.0": 1,
    }
    y = df["label"].astype(str).str.strip().str.lower().map(label_map)
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
        "logistic_regression": (LogisticRegression(max_iter=1000), {"C": [1.0]}),
        "random_forest": (RandomForestClassifier(random_state=42), {"n_estimators": [120], "max_depth": [None]}),
        "gradient_boosting": (GradientBoostingClassifier(random_state=42), {"n_estimators": [100], "learning_rate": [0.1]}),
        "extra_trees": (ExtraTreesClassifier(random_state=42), {"n_estimators": [120], "max_depth": [None]}),
        "decision_tree": (DecisionTreeClassifier(random_state=42), {"max_depth": [None, 12]}),
        "knn": (KNeighborsClassifier(), {"n_neighbors": [5], "weights": ["distance"]}),
        "gaussian_nb": (GaussianNB(), {"var_smoothing": [1e-8]}),
        "sgd_log_loss": (SGDClassifier(loss="log_loss", random_state=42, max_iter=1500, tol=1e-3), {"alpha": [1e-4]}),
        "passive_aggressive": (PassiveAggressiveClassifier(random_state=42, max_iter=1000, tol=1e-3), {"C": [0.5, 1.0]}),
        "perceptron": (Perceptron(random_state=42, max_iter=1000, tol=1e-3), {"penalty": [None, "l2"]}),
    }
    print(f"Training {len(candidates)} candidate models...")

    best_name = None
    best_model = None
    best_score = -1.0
    all_metrics = {}

    for name, (base_model, grid) in candidates.items():
        search = GridSearchCV(base_model, grid, scoring="f1", cv=2, n_jobs=-1)
        search.fit(X_train, y_train)

        model = search.best_estimator_
        y_pred = model.predict(X_test)
        y_prob = _to_prob(model, X_test)

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

    best_prob = _to_prob(best_model, X_test)
    best_pred = best_model.predict(X_test)

    distribution = {"safe": 0, "low": 0, "high": 0}
    for p in best_prob:
        distribution[_severity_bucket(float(p))] += 1

    total = max(len(best_prob), 1)
    severity_percentages = {k: round((v / total) * 100.0, 2) for k, v in distribution.items()}

    sample_thresholds = {
        "low": _risk_thresholds(0.2),
        "medium": _risk_thresholds(0.5),
        "high": _risk_thresholds(0.9),
    }

    joblib.dump(best_model, model_save_path)
    with pickle_save_path.open("wb") as f:
        pickle.dump(best_model, f)
    joblib.dump(
        {
            "best_model": best_name,
            "models_evaluated": len(all_metrics),
            "metrics": all_metrics,
            "inference_ms_for_50_samples": round(inference_ms, 3),
            "risk_thresholds": sample_thresholds,
            "classes": ["safe", "suspicious", "phishing"],
            "severity_distribution": distribution,
            "severity_percentages": severity_percentages,
            "test_set_size": int(total),
            "phishing_rate_percent": round(float(best_pred.mean() * 100.0), 2),
        },
        metrics_save_path,
    )

    print(f"Saved best model ({best_name}) to {model_save_path}")
    print(f"Saved best model pickle to {pickle_save_path}")
    print(f"Saved model metrics to {metrics_save_path}")


if __name__ == "__main__":
    train()
