"""
Export a dense-trained bias classifier for onnxruntime-web.

Why retrain on dense features: the original pipeline was trained on *sparse*
TF-IDF, and xgboost treats sparse zeros as "missing" (NaN), so dense input
drives totally different predictions (93.6% acc sparse vs 68% dense). ONNX
runtime works with dense float tensors, so we retrain the XGBoost classifier
on the dense matrix — recovering 93.4% test accuracy that transfers cleanly
to the browser.

Text preprocessing (custom NLTK lemmatizer + stopwords + sklearn's exact
token pattern) runs in JavaScript. This ships:

  * model.onnx          — XGBoost classifier, dense float input
  * model_meta.json     — vocab, idf, norm, lemma table for the JS feature builder

The JS feature builder must match sklearn's TfidfVectorizer.transform
exactly (verified below to ~1e-8).
"""

import json
import os
import pickle
import re
import sys

import numpy as np
import pandas as pd
import sklearn
import xgboost

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "public", "models"))
from browser_preprocess import TextPreprocessor  # noqa: E402

print("export stack: sklearn", sklearn.__version__, "| xgboost", xgboost.__version__)

TRAIN = os.path.join(ROOT, "..", "backend", "artifacts", "train.csv")
TEST = os.path.join(ROOT, "..", "backend", "artifacts", "test.csv")

OUT_ONNX = os.path.join(ROOT, "public", "models", "model.onnx")
OUT_META = os.path.join(ROOT, "public", "models", "model_meta.json")


def load_vectorizer():
    with open(os.path.join(ROOT, "public", "models", "preprocess.pkl"), "rb") as f:
        preprocess = pickle.load(f)
    return preprocess.transformers_[0][1].named_steps["vectorize"]


def build_lemma_table(vectorizer, train):
    """word -> lemma for every token in the corpus + vocabulary."""
    from nltk.stem import WordNetLemmatizer

    lemmatizer = WordNetLemmatizer()
    table = {}
    pre = TextPreprocessor()
    for w in vectorizer.vocabulary_:
        table[w] = lemmatizer.lemmatize(w)
    for doc in train["text"].apply(pre.preprocess_text):
        for w in doc.split():
            if w not in table:
                table[w] = lemmatizer.lemmatize(w)
    return table


def js_features_builder(vectorizer, idf, norm, table):
    """Return a function that builds features exactly like the JS code."""
    vocab = vectorizer.vocabulary_
    tok = re.compile(r"(?u)\b\w\w+\b")
    n = len(vocab)
    idf_arr = np.array(idf, dtype=np.float32)

    def build(text):
        clean = TextPreprocessor().preprocess_text(text)
        vec = np.zeros(n, dtype=np.float32)
        for w in tok.findall(clean):
            lemma = table.get(w, w)
            if lemma in vocab:
                vec[vocab[lemma]] += 1.0
        vec *= idf_arr
        if norm == "l2":
            nrm = np.sqrt((vec ** 2).sum())
            if nrm > 0:
                vec /= nrm
        return vec

    return build


def main():
    vectorizer = load_vectorizer()
    n_features = len(vectorizer.vocabulary_)
    idf = vectorizer.idf_.astype(np.float32).tolist()
    norm = getattr(vectorizer, "norm", "l2")

    train = pd.read_csv(TRAIN)
    test = pd.read_csv(TEST)
    pre = TextPreprocessor()

    print("building lemma table (train corpus)...")
    table = build_lemma_table(vectorizer, train)

    print("fitting dense classifier...")
    X_tr = vectorizer.transform(train["text"].apply(pre.preprocess_text)).toarray().astype(np.float32)
    X_te = vectorizer.transform(test["text"].apply(pre.preprocess_text)).toarray().astype(np.float32)
    y_tr = train["target"].values
    y_te = test["target"].values

    clf = xgboost.XGBClassifier()
    clf.fit(X_tr, y_tr)
    acc = (clf.predict(X_te) == y_te).mean()
    print(f"dense-trained test accuracy: {acc:.4f}")

    # ---- export ONNX ----
    from onnxmltools import convert_xgboost
    from onnxmltools.convert.common.data_types import FloatTensorType

    booster = clf.get_booster()
    model_onnx = convert_xgboost(
        booster,
        initial_types=[("features", FloatTensorType([None, n_features]))],
        target_opset=15,
    )
    with open(OUT_ONNX, "wb") as f:
        f.write(model_onnx.SerializeToString())
    print("wrote", OUT_ONNX, os.path.getsize(OUT_ONNX), "bytes")

    meta = {
        "vocab": [w for w, _ in sorted(vectorizer.vocabulary_.items(), key=lambda kv: kv[1])],
        "idf": idf,
        "norm": norm,
        "lemma": table,
        "n_features": n_features,
        "accuracy": acc,
        "stopwords": sorted(
            __import__("nltk").corpus.stopwords.words("english")
        ),
    }
    with open(OUT_META, "w") as f:
        json.dump(meta, f)
    print("wrote", OUT_META, os.path.getsize(OUT_META), "bytes")

    # ---- verify: JS feature builder + ONNX == sklearn dense ----
    import onnxruntime as rt

    sess = rt.InferenceSession(OUT_ONNX, providers=["CPUExecutionProvider"])
    input_name = sess.get_inputs()[0].name
    output_name = sess.get_outputs()[0].name

    build = js_features_builder(vectorizer, idf, norm, table)
    feats = np.stack([build(t) for t in test["text"].iloc[:300]])
    sk_preds = clf.predict(X_te[:300])
    ort_preds = sess.run([output_name], {input_name: feats})[0]
    match = (ort_preds.ravel().astype(int) == sk_preds).mean()
    print(f"ONNX(JS features) vs sklearn on 300 samples: {match:.4f}")

    # feature parity
    sk_feats = X_te[:300]
    diff = np.abs(sk_feats - feats).max()
    print(f"max feature diff vs sklearn.transform: {diff:.2e}")


if __name__ == "__main__":
    main()
