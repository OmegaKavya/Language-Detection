// The model, reimplemented in the browser.
//
// A TF-IDF character n-gram vectoriser followed by multinomial naive Bayes is
// a sparse dot product and an argmax. Running it here rather than on a server
// means no cold start, no hosting cost, and the page works offline.
//
// Every step mirrors what scikit-learn does, and the numbers are checked
// against it rather than assumed: see scripts/verify_browser_model.mjs.

function unpack(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

export function loadModel(raw) {
  const index = new Map(raw.terms.map((term, i) => [term, i]));
  return {
    classes: raw.classes,
    terms: raw.terms,
    ngramRange: raw.ngramRange,
    sublinearTf: raw.sublinearTf,
    index,
    nTerms: raw.terms.length,
    idf: unpack(raw.idf),
    logProb: unpack(raw.logProb),
    classLogPrior: unpack(raw.classLogPrior),
  };
}

/** Lowercase, keep letters in any script, collapse whitespace. */
export function preprocess(text) {
  let out = "";
  for (const ch of String(text).toLowerCase()) {
    // \p{L} is Unicode letters, matching Python's str.isalpha closely enough
    // for this purpose; whitespace is kept and collapsed below.
    if (/\p{L}/u.test(ch) || /\s/.test(ch)) out += ch;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Raw term counts, exactly the n-grams scikit-learn's char analyzer emits. */
function countNgrams(text, [lo, hi], index) {
  const counts = new Map();
  // Operate on code points, so a multi-byte character is one character.
  const chars = Array.from(text);
  for (let n = lo; n <= hi; n += 1) {
    for (let i = 0; i + n <= chars.length; i += 1) {
      const gram = chars.slice(i, i + n).join("");
      const column = index.get(gram);
      if (column === undefined) continue; // out of vocabulary, as sklearn drops it
      counts.set(column, (counts.get(column) || 0) + 1);
    }
  }
  return counts;
}

export function detect(model, text) {
  const cleaned = preprocess(text);
  if (!cleaned) return null;

  const counts = countNgrams(cleaned, model.ngramRange, model.index);
  if (counts.size === 0) return null;

  // sublinear_tf: tf becomes 1 + log(tf). Then multiply by idf and L2 normalise.
  const weights = new Map();
  let norm = 0;
  for (const [column, count] of counts) {
    const tf = model.sublinearTf ? 1 + Math.log(count) : count;
    const value = tf * model.idf[column];
    weights.set(column, value);
    norm += value * value;
  }
  norm = Math.sqrt(norm) || 1;

  const nClasses = model.classes.length;
  const scores = new Float64Array(nClasses);
  for (let c = 0; c < nClasses; c += 1) {
    let total = model.classLogPrior[c];
    const base = c * model.nTerms;
    for (const [column, value] of weights) {
      total += (value / norm) * model.logProb[base + column];
    }
    scores[c] = total;
  }

  // Softmax over the joint log likelihoods, which is what predict_proba does.
  let best = 0;
  let max = -Infinity;
  for (let c = 0; c < nClasses; c += 1) {
    if (scores[c] > max) { max = scores[c]; best = c; }
  }
  let sum = 0;
  const probs = new Float64Array(nClasses);
  for (let c = 0; c < nClasses; c += 1) { probs[c] = Math.exp(scores[c] - max); sum += probs[c]; }

  const ranked = model.classes
    .map((name, c) => ({ language: name, probability: probs[c] / sum }))
    .sort((a, b) => b.probability - a.probability);

  // Why this language and not the runner-up. For each n-gram present, the
  // difference its log-probability makes between the winner and the second
  // place, weighted by how strongly the n-gram appears. This is the model's
  // own arithmetic, not a post-hoc explanation.
  const runnerUp = model.classes.indexOf(ranked[1]?.language ?? model.classes[best]);
  const winnerBase = best * model.nTerms;
  const rivalBase = runnerUp * model.nTerms;
  const evidence = [];
  for (const [column, value] of weights) {
    const weight = value / norm;
    evidence.push({
      ngram: model.terms ? model.terms[column] : null,
      column,
      contribution: weight * (model.logProb[winnerBase + column] - model.logProb[rivalBase + column]),
    });
  }
  evidence.sort((a, b) => b.contribution - a.contribution);

  return {
    language: model.classes[best],
    confidence: ranked[0].probability,
    ranked,
    cleaned,
    against: model.classes[runnerUp],
    evidence: evidence.slice(0, 12),
  };
}
