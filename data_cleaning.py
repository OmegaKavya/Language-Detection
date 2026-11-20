"""Clean the dataset without deleting most of it.

The original cleaner ran re.sub(r'[^a-z\\s]', '', text), which keeps only
lowercase ASCII letters. For a dataset of seventeen languages that is not a
cleaning step, it is a filter: it removed 98.1% of Tamil rows, 96.2% of
Kannada, 95.6% of Malayalam, 92.7% of Arabic, 89.0% of Greek, 85.4% of
Russian and 79.4% of Hindi, leaving empty strings behind. 27.5% of the corpus
became blank, and every blanked row belonged to a non-Latin script.

The model was then asked to tell those seven languages apart from nothing,
and scored exactly 0% on all of them while reporting 66% overall, because the
ten Latin-script languages carried the average.

str.isalpha is Unicode aware, so the rule below keeps letters in any script
and still drops digits, punctuation and symbols.
"""
import re
import unicodedata

import pandas as pd

INPUT_FILE = "Language Detection.csv"
OUTPUT_FILE = "Language_Detection_Cleaned.csv"


def _is_letter(ch):
    """Letters, and the marks that attach to them.

    str.isalpha alone is not enough. Indic scripts write vowels and the virama
    as combining marks, Unicode categories Mn and Mc, for which isalpha is
    False. Dropping them silently removed 44% of the characters in Tamil,
    Kannada, Malayalam and Hindi: still enough for the classifier to work,
    which is exactly why it would have gone unnoticed without a test.
    """
    return ch.isalpha() or unicodedata.category(ch).startswith("M")


def preprocess_text(text):
    """Lowercase, keep letters and their marks in any script, drop the rest."""
    text = str(text).lower()
    text = "".join(ch for ch in text if _is_letter(ch) or ch.isspace())
    return re.sub(r"\s+", " ", text).strip()


def main():
    data = pd.read_csv(INPUT_FILE).dropna(subset=["Text", "Language"])
    data["Text"] = data["Text"].astype(str).str.strip()

    # Exact duplicates would otherwise straddle the train/test split and
    # inflate the score on both sides of it.
    before = len(data)
    data = data.drop_duplicates(subset=["Text"])
    print(f"dropped {before - len(data)} duplicate texts")

    data["Text"] = data["Text"].apply(preprocess_text)

    blank = (data["Text"].str.len() == 0).sum()
    if blank:
        print(f"warning: {blank} rows are empty after cleaning")
    data = data[data["Text"].str.len() > 0]

    data.to_csv(OUTPUT_FILE, index=False)
    print(f"wrote {len(data)} rows to {OUTPUT_FILE}")
    print(data.groupby("Language").size().to_string())


if __name__ == "__main__":
    main()
