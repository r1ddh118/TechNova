"""Read data/dummy_data.csv, compute features using backend.nlp_engine, and write features to data/features.csv and a sparse matrix .npz
"""
import csv
from pathlib import Path
import numpy as np
import pandas as pd
from vectorizer import EnhancedVectorizer

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
INPUT = DATA_DIR / "dummy_data.csv"
FEATURE_CSV = DATA_DIR / "features.csv"
FEATURE_NPZ = DATA_DIR / "features.npz"


def main():
    df = pd.read_csv(INPUT)
    texts = df['text'].fillna("").astype(str).tolist()

    vec = EnhancedVectorizer(max_features=1000)
    X = vec.fit_transform(texts)

    # save dense numeric features for explainability (last 6 columns)
    # Extract numeric part from sparse matrix by converting last 6 columns
    num_cols = 6
    X_dense = X[:, -num_cols:].toarray()
    feature_names = [
        'url_count', 'suspicious_url_score', 'urgency_score',
        'impersonation_score', 'digit_count', 'text_length'
    ]

    features_df = pd.DataFrame(X_dense, columns=feature_names)
    out_df = pd.concat([df[['id','source','label']].reset_index(drop=True), features_df], axis=1)
    out_df.to_csv(FEATURE_CSV, index=False)

    # save sparse full matrix
    from scipy import sparse
    sparse.save_npz(FEATURE_NPZ, X)

    # save vectorizer for reuse
    MODEL_DIR = ROOT / "backend" / "model"
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    vec.save(MODEL_DIR / "vectorizer.joblib")

    print("Wrote", FEATURE_CSV, FEATURE_NPZ)


if __name__ == '__main__':
    main()
