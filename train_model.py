"""Train the language detector and report per language, not just overall.

Two settings here are deliberate and were measured, not assumed.

fit_prior=False gives every language the same prior. With fitted priors the
classifier inherits the corpus imbalance, and once the cleaner stopped
deleting non-Latin scripts the feature space grew from ASCII to 44,000
character n-grams. Laplace smoothing then spread so much mass across that
space that small classes could not win: German fell to 16% and three quarters
of its test rows were predicted English, which has the most training data.
A language detector has no business assuming English is more likely.

alpha=0.01 reduces that smoothing. At the default of 1.0 the same collapse
happens more mildly.

max_features=20000 caps the vocabulary. It was measured against the full
44,157 features and is not a compromise: it scores slightly higher overall
and raises the worst class from 94.1% to 96.5%, because the discarded tail is
mostly n-grams seen a handful of times. It also makes the model small enough
to export and run in a browser, which is how it is served.

Overall accuracy is reported last and on purpose. The original model reported
91% while scoring zero on seven of its seventeen languages, so the headline
number was the thing hiding the fault.
"""
import os
import pickle

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

DATA_PATH = "Language_Detection_Cleaned.csv"
MODEL_PATH = "language_detection_model.pkl"


def build_pipeline():
    return Pipeline([
        ("tfidf", TfidfVectorizer(analyzer="char", ngram_range=(1, 3), sublinear_tf=True,
                                  max_features=20000)),
        ("clf", MultinomialNB(alpha=0.01, fit_prior=False)),
    ])


def train_and_save_model(data_path=DATA_PATH, model_path=MODEL_PATH):
    here = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(here, data_path)
    model_path = os.path.join(here, model_path)

    data = pd.read_csv(data_path).dropna(subset=["Text", "Language"])
    X, y = data["Text"].astype(str), data["Language"]

    # Stratified, so a small class like Hindi cannot land mostly on one side.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = build_pipeline().fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    report = classification_report(y_test, y_pred, zero_division=0)
    accuracy = accuracy_score(y_test, y_pred)

    per_class = pd.DataFrame({"actual": y_test, "ok": y_pred == y_test})
    worst = (per_class.groupby("actual").ok.mean() * 100).sort_values()
    print("Per language accuracy, worst first:")
    print(worst.round(1).to_string())
    print(f"\nWorst class: {worst.index[0]} at {worst.iloc[0]:.1f}%")
    print(f"Overall: {100 * accuracy:.1f}%")

    with open(model_path, "wb") as handle:
        pickle.dump(pipeline, handle)
    print(f"saved {model_path}")
    return accuracy, report


if __name__ == "__main__":
    train_and_save_model()
