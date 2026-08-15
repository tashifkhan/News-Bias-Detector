"""
Retrain the bias pipeline with the EXACT versions Pyodide v314.0.4 ships,
so the pickles unpickle cleanly in the browser with zero version warnings.

Pyodide 314.0.4: scikit-learn 1.8.0, numpy 2.4.3, scipy 1.18.0,
joblib 1.5.3, pandas 3.0.2, xgboost 2.1.4, nltk 3.9.4

Same data, same preprocessing, same model class as the original repo.
"""

import os
import re
import pickle
import sys

import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from xgboost import XGBClassifier

import sklearn, xgboost, nltk, numpy as npv
print("train stack: sklearn", sklearn.__version__, "| xgboost", xgboost.__version__,
      "| numpy", npv.__version__, "| nltk", nltk.__version__)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "public", "models"))
from browser_preprocess import TextPreprocessor  # noqa: E402

TRAIN = os.path.join(ROOT, "..", "backend", "artifacts", "train.csv")
TEST = os.path.join(ROOT, "..", "backend", "artifacts", "test.csv")


def build_pipeline():
    preprocess = ColumnTransformer(
        transformers=[
            (
                "text_pipeline",
                Pipeline(
                    [
                        ("text_preprocessing", TextPreprocessor()),
                        ("vectorize", TfidfVectorizer()),
                    ]
                ),
                "text",
            )
        ],
        sparse_threshold=0.3,
    )
    return Pipeline([("preprocess", preprocess), ("classifier", XGBClassifier())])


def main():
    train = pd.read_csv(TRAIN)
    test = pd.read_csv(TEST)
    X_train, y_train = train[["text"]], train["target"]
    X_test, y_test = test[["text"]], test["target"]

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_test)
    print(f"test accuracy  : {accuracy_score(y_test, y_pred):.4f}")
    print(f"test f1        : {f1_score(y_test, y_pred):.4f}")
    print(f"test precision : {precision_score(y_test, y_pred):.4f}")
    print(f"test recall    : {recall_score(y_test, y_pred):.4f}")
    print("test rows:", len(test), "| target dist:", test["target"].value_counts().to_dict())

    vocab = pipe.named_steps["preprocess"].transformers_[0][1].named_steps["vectorize"].vocabulary_
    print("vocab size:", len(vocab))

    out = os.path.join(ROOT, "public", "models")
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "preprocess.pkl"), "wb") as f:
        pickle.dump(pipe.named_steps["preprocess"], f, protocol=5)
    with open(os.path.join(out, "model.pkl"), "wb") as f:
        pickle.dump(pipe.named_steps["classifier"], f, protocol=5)

    # golden predictions for the browser test harness
    with open(os.path.join(out, "golden.json"), "w") as f:
        import json
        rows = []
        for i in range(min(8, len(test))):
            rows.append(
                {
                    "text": test["text"].iloc[i][:400],
                    "expected": int(y_test.iloc[i]),
                    "pred": int(y_pred[i]),
                }
            )
        json.dump(rows, f, indent=2)
    print("wrote", os.listdir(out))


if __name__ == "__main__":
    main()
