# Which Language Is This

**[Live](https://whichlanguage.web.app)** · seventeen languages, identified from
character patterns, with the model running entirely in the browser.

A character n-gram TF-IDF vectoriser feeding multinomial naive Bayes. The
interesting part of this repository is not the model, it is what was wrong
with the pipeline around it.

## The headline number was hiding a total failure

The project reported 91% accuracy, measured on a test split from which the
cleaning step had already removed most of seven languages. Measured per
language on held-out text as the app received it, the deployed model scored
65.8% overall and **exactly 0.0%** on seven of its seventeen languages, across
612 samples. Never once correct, not merely poor. All of the 65.8% came from
the ten Latin-script languages.

The cause was the cleaning step:

```python
text = re.sub(r'[^a-z\s]', '', text)   # keeps lowercase ASCII, deletes the rest
```

On a corpus of seventeen languages that is not a cleaning step, it is a
filter. It left 0.2% of the characters in the Tamil rows and blanked 98.1% of
them outright. Across the corpus it destroyed **27.5% of the data**, and every
destroyed row but one (a Spanish row reading "(2008).") belonged to a
non-Latin script.

| | rows blanked | characters surviving |
| --- | ---: | ---: |
| Tamil | 98.1% | 0.2% |
| Kannada | 96.2% | 0.2% |
| Malayalam | 95.6% | 0.6% |
| Arabic | 92.7% | 0.6% |
| Greek | 89.0% | 0.8% |
| Russian | 85.4% | 1.9% |
| Hindi | 79.4% | 0.3% |
| every Latin-script language | 0.0% | ~92% |

## Three bugs, each found by fixing the one before it

1. **The cleaner deleted the evidence.** Cleaning is Unicode aware now, and
   keeps combining marks as well as letters: Indic scripts write vowels and
   the virama as Unicode categories `Mn` and `Mc`, for which `str.isalpha` is
   False, and dropping them removes 44% of the characters in Tamil, Kannada,
   Malayalam and Hindi. That second bug was caught by a test, not by reading.
2. **Training and serving disagreed.** The app passed raw text to a model
   fitted on cleaned text. Inference imports the same function now, so there
   is one implementation and it cannot drift.
3. **Fixing those collapsed the small classes.** Letting the scripts through
   grew the feature space from ASCII to 44,000 n-grams, and the default
   Laplace smoothing spread so much mass across it that German fell to 16%,
   three quarters of it predicted English, the largest class. Uniform class
   priors and `alpha=0.01` fixed it. A language detector has no business
   assuming English is more likely than Kannada.

## Results

Measured end to end on the same held-out rows, each model given exactly what
its own version of the app handed it.

| | before | after |
| --- | ---: | ---: |
| Tamil, Kannada, Malayalam, Arabic, Greek, Hindi | 0.0% | 100.0% |
| Russian | 0.0% | 98.6% |
| Danish | 72.9% | 96.5% |
| German | 84.9% | 98.9% |
| **Worst language** | **0.0%** | **96.5%** |
| **Overall** | **65.8%** | **99.1%** |

Overall accuracy is the least interesting number here. The original 91% was
not a model that needed improving, it was a pipeline reporting an average over
data it had deleted.

Logistic regression and a linear SVM were fitted on the same features to check
that naive Bayes was not the limitation. All three landed within a tenth of a
point, so the model family was never the problem.

## No server

A TF-IDF character n-gram vectoriser followed by multinomial naive Bayes is a
sparse dot product and an argmax, so the trained pipeline is exported to
20,000 terms and reimplemented in JavaScript. It agrees with scikit-learn on
every one of 2,053 held-out rows, with probabilities matching to 1.9e-7.

The page therefore has no backend: no cold start, no hosting cost, and nothing
typed into it leaves the browser.

Capping the vocabulary at 20,000 was measured rather than assumed. It scores
slightly higher than the full 44,157 features and lifts the worst class from
94.1% to 96.5%, because the discarded tail is mostly n-grams seen a handful of
times.

## Running it

```bash
pip install -r requirements.txt

python data_cleaning.py                  # rebuild the cleaned dataset
python train_model.py                    # train, report per language, save
python scripts/export_browser_model.py   # write web/src/model.json
pytest                                   # 24 tests

node scripts/verify_browser_model.mjs    # JS against scikit-learn, exactly

cd web && npm install && npm run dev
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the pipeline and the decisions
behind it.
