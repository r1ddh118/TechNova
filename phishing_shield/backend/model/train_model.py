import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

def train():
    ROOT = Path(__file__).resolve().parents[2]
    DATA_PATH = ROOT / "data" / "features.csv"
    MODEL_SAVE_PATH = Path(__file__).resolve().parent / "model.joblib"

    
    df = pd.read_csv(DATA_PATH, low_memory=False)
    print(f"Initial rows: {len(df)}")

    
    df = df.dropna(subset=['label'])
    print(f"Rows after dropping missing labels: {len(df)}")

    
    X = df.select_dtypes(include=['number'])
    
    if 'label' in X.columns:
        X = X.drop(columns=['label'])
    
    
    X = X.fillna(0) 
    
    y = df['label']

    
    if y.isnull().any():
        print(" Still found NaNs in y! Forcing removal...")
        mask = y.notnull()
        X = X[mask]
        y = y[mask]

    print(f"Final training set: {len(X)} samples with {len(X.columns)} features.")
    
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)


    joblib.dump(model, MODEL_SAVE_PATH)
    print(f" Success! Model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train()