"""Pure-Python preprocessing module for in-browser unpickling (Pyodide).

The pickled preprocessor references `browser_preprocess.TextPreprocessor`.
In the browser this file is made importable by adding /models to sys.path,
so pickle.load() can resolve the class without needing the FastAPI backend.

Identical behaviour to backend/src/utils.py: lowercase -> strip non
[a-zA-Z0-9-] -> drop NLTK english stopwords -> WordNet lemmatize.
"""

import re

from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.base import BaseEstimator, TransformerMixin

stop_words = set(stopwords.words("english"))


class TextPreprocessor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()

    def preprocess_text(self, text):
        if isinstance(text, str):
            text = text.lower()
            text = re.sub(r"[^a-zA-Z0-9\s-]", "", text)
            text = " ".join(
                [
                    self.lemmatizer.lemmatize(word)
                    for word in text.split()
                    if word not in stop_words
                ]
            )
        return text

    def fit(self, X, y=None):
        return self

    def transform(self, X, y=None):
        return X.apply(self.preprocess_text)
