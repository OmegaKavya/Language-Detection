"""What the model must still do, per language rather than on average.

The original model reported 91% while scoring exactly zero on seven of its
seventeen languages. An aggregate assertion would have passed. These assert a
floor on every class.
"""
import os
import pickle
import sys

import pandas as pd
import pytest
from sklearn.model_selection import train_test_split

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from data_cleaning import preprocess_text  # noqa: E402

WORST_CLASS_FLOOR = 0.90
OVERALL_FLOOR = 0.97


@pytest.fixture(scope="module")
def model():
    with open(os.path.join(ROOT, "language_detection_model.pkl"), "rb") as handle:
        return pickle.load(handle)


@pytest.fixture(scope="module")
def holdout():
    data = pd.read_csv(os.path.join(ROOT, "Language_Detection_Cleaned.csv"))
    data = data.dropna(subset=["Text", "Language"])
    _, test = train_test_split(
        data, test_size=0.2, random_state=42, stratify=data["Language"]
    )
    return test


def test_no_language_is_left_behind(model, holdout):
    ok = model.predict(holdout["Text"].astype(str)) == holdout["Language"]
    per_class = pd.DataFrame({"language": holdout["Language"], "ok": ok})
    worst = per_class.groupby("language").ok.mean().sort_values()
    assert worst.iloc[0] >= WORST_CLASS_FLOOR, (
        f"{worst.index[0]} scores {100 * worst.iloc[0]:.1f}%, "
        f"below the {100 * WORST_CLASS_FLOOR:.0f}% floor"
    )


def test_overall_accuracy_holds(model, holdout):
    ok = (model.predict(holdout["Text"].astype(str)) == holdout["Language"]).mean()
    assert ok >= OVERALL_FLOOR


def test_priors_are_uniform(model):
    """Fitted priors let the largest class swallow the small ones: German fell
    to 16%, three quarters of it predicted English."""
    assert model.named_steps["clf"].fit_prior is False


def test_inference_path_cleans_its_input(model):
    """Training and serving must agree. Raw text with punctuation and capitals
    has to reach the same verdict as its cleaned form."""
    raw = "Dieses Buch habe ich letzten Sommer gelesen!!! 2024"
    assert model.predict([preprocess_text(raw)])[0] == "German"
