from pathlib import Path
from time import perf_counter

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import (
    AdaBoostClassifier,
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier


LOW_RISK_MAX = 0.35
HIGH_RISK_MIN = 0.7


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


def _candidate_models():
    return {
        "logistic_regression": (
            Pipeline([
                ("scaler", StandardScaler()),
                ("model", LogisticRegression(max_iter=3000, random_state=42)),
            ]),
            {
                "model__C": [0.5, 1.0, 2.0],
                "model__class_weight": [None, "balanced"],
            },
        ),
        "random_forest": (
            RandomForestClassifier(random_state=42),
            {
                "n_estimators": [200, 350],
                "max_depth": [None, 20],
                "min_samples_split": [2, 5],
            },
        ),
        "gradient_boosting": (
            GradientBoostingClassifier(random_state=42),
            {
                "n_estimators": [100, 200],
                "learning_rate": [0.05, 0.1],
                "max_depth": [3, 4],
            },
        ),
        "extra_trees": (
            ExtraTreesClassifier(random_state=42),
            {
                "n_estimators": [200, 350],
                "max_depth": [None, 20],
                "min_samples_split": [2, 5],
            },
        ),
        "adaboost": (
            AdaBoostClassifier(random_state=42),
            {
                "n_estimators": [100, 200],
                "learning_rate": [0.5, 1.0],
            },
        ),
        "decision_tree": (
            DecisionTreeClassifier(random_state=42),
            {
                "max_depth": [None, 10, 20],
                "min_samples_split": [2, 5, 10],
                "class_weight": [None, "balanced"],
            },
        ),
        "knn": (
            Pipeline([
                ("scaler", StandardScaler()),
                ("model", KNeighborsClassifier()),
            ]),
            {
                "model__n_neighbors": [5, 11, 21],
                "model__weights": ["uniform", "distance"],
            },
        ),
        "svc_rbf": (
            Pipeline([
                ("scaler", StandardScaler()),
                ("model", SVC(probability=True, random_state=42)),
            ]),
            {
                "model__C": [1.0, 3.0],
                "model__gamma": ["scale", "auto"],
                "model__class_weight": [None, "balanced"],
            },
        ),
        "gaussian_nb": (
            GaussianNB(),
            {
                "var_smoothing": np.logspace(-9, -7, 3),
            },
        ),
        "mlp": (
            Pipeline([
                ("scaler", StandardScaler()),
                (
                    "model",
                    MLPClassifier(max_iter=500, random_state=42, early_stopping=True),
                ),
            ]),
            {
                "model__hidden_layer_sizes": [(64,), (128, 64)],
                "model__alpha": [1e-4, 1e-3],
                "model__learning_rate_init": [1e-3, 5e-4],
            },
        ),
    }


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

    best_name = None
    best_model = None
    best_score = -1.0
    all_metrics = {}

    for name, (base_model, grid) in _candidate_models().items():
        print(f"Training candidate: {name}")
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
            "models_evaluated": len(all_metrics),
            "metrics": all_metrics,
            "inference_ms_for_50_samples": round(inference_ms, 3),
            "risk_thresholds": {
                "low_max": LOW_RISK_MAX,
                "high_min": HIGH_RISK_MIN,
                "sample_labels": sample_thresholds,
            },
        },
        metrics_save_path,
    )

    print(f"Saved best model ({best_name}) to {model_save_path}")
    print(f"Saved model metrics to {metrics_save_path}")


if __name__ == "__main__":
    train()
