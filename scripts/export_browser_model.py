"""Export the trained pipeline so a browser can run it.

The whole model is a vocabulary of character n-grams, one idf weight each,
and a log-probability per n-gram per language. That is arithmetic any
JavaScript engine can do, so there is no reason to keep a Python server alive
just to multiply a sparse vector by a matrix.

Floats go out as base64 Float32 rather than JSON numbers, which is roughly
four times smaller and exact.
"""
import base64
import json
import os
import pickle

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    with open(os.path.join(ROOT, "language_detection_model.pkl"), "rb") as handle:
        pipeline = pickle.load(handle)

    tfidf = pipeline.named_steps["tfidf"]
    clf = pipeline.named_steps["clf"]

    # vocabulary_ maps n-gram -> column. Emit in column order so the client
    # can use the array index directly.
    terms = [None] * len(tfidf.vocabulary_)
    for term, index in tfidf.vocabulary_.items():
        terms[index] = term

    def pack(array):
        return base64.b64encode(np.asarray(array, dtype=np.float32).tobytes()).decode("ascii")

    model = {
        "classes": list(clf.classes_),
        "ngramRange": list(tfidf.ngram_range),
        "sublinearTf": bool(tfidf.sublinear_tf),
        "terms": terms,
        "idf": pack(tfidf.idf_),
        # Row-major: one row per class, one column per term.
        "logProb": pack(clf.feature_log_prob_.ravel()),
        "classLogPrior": pack(clf.class_log_prior_),
    }

    out = os.path.join(ROOT, "web", "src", "model.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as handle:
        json.dump(model, handle, separators=(",", ":"))
    print(f"{len(terms)} terms, {len(model['classes'])} classes "
          f"-> {os.path.getsize(out) / 1e6:.2f} MB at {out}")


if __name__ == "__main__":
    main()
