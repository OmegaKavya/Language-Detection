"""The cleaner must not delete languages.

These exist because it did. The original rule, re.sub(r'[^a-z\\s]', ''),
blanked 98.1% of Tamil rows and 27.5% of the corpus, and nothing failed to
say so: there were no tests, and the only number anyone looked at was an
average over the languages that survived.
"""
import os
import sys

import pandas as pd
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_cleaning import preprocess_text  # noqa: E402

SAMPLES = {
    "Tamil": "நான் தினமும் காலையில் நடக்கச் செல்கிறேன்",
    "Kannada": "ನಾನು ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ನಡೆಯಲು ಹೋಗುತ್ತೇನೆ",
    "Malayalam": "ഞാൻ എല്ലാ ദിവസവും രാവിലെ നടക്കാൻ പോകും",
    "Hindi": "मैं हर सुबह पार्क में टहलने जाता हूँ",
    "Arabic": "الطقس جميل اليوم ونحن ذاهبون إلى الحديقة",
    "Greek": "Το καλοκαίρι πηγαίνουμε στο νησί",
    "Russian": "Сегодня вечером мы идём в театр",
    "English": "The weather has been unusually warm this week",
}


@pytest.mark.parametrize("language,text", sorted(SAMPLES.items()))
def test_cleaning_keeps_every_script(language, text):
    """No language may survive cleaning as an empty string."""
    assert preprocess_text(text) != "", f"{language} was blanked by the cleaner"


@pytest.mark.parametrize("language,text", sorted(SAMPLES.items()))
def test_cleaning_keeps_most_of_the_characters(language, text):
    """The old rule left 0.2% of Tamil. Anything near that is the bug back."""
    kept = len(preprocess_text(text).replace(" ", ""))
    total = len(text.replace(" ", ""))
    assert kept / total > 0.8, f"{language} lost {100 * (1 - kept / total):.0f}% of its characters"


def test_digits_and_punctuation_still_go():
    assert preprocess_text("Hello, world! 123") == "hello world"


def test_whitespace_is_collapsed():
    assert preprocess_text("  a\t\tb\n\nc  ") == "a b c"


def test_text_with_no_letters_becomes_empty():
    """The app relies on this to refuse input rather than guess at it."""
    assert preprocess_text("12345 !!! ???") == ""


def test_the_shipped_dataset_has_no_blank_rows():
    """The regression in full: if cleaning ever deletes rows again, the
    committed dataset will show it."""
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data = pd.read_csv(os.path.join(here, "Language_Detection_Cleaned.csv"))
    blank = data["Text"].astype(str).str.strip().eq("").sum()
    assert blank == 0, f"{blank} rows are empty in the cleaned dataset"
    # Every language the raw file has must still be represented.
    raw = pd.read_csv(os.path.join(here, "Language Detection.csv")).dropna()
    assert set(data["Language"]) == set(raw["Language"])
