// Helpers that show the detector's reasoning on the text itself.

// Python 3's \s on str, which is str.isspace. JavaScript's \s differs: it
// leaves out U+001C to U+001F and U+0085 and adds U+FEFF, so the legacy rule
// spells the class out rather than borrowing JavaScript's.
const PY_SPACE = String.raw`\t\n\v\f\r\x1c-\x20\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000`;
const PY_SPACE_RUN = new RegExp(`[${PY_SPACE}]+`, "g");
const PY_NOT_A_Z_OR_SPACE = new RegExp(`[^a-z${PY_SPACE}]`, "g");

/**
 * The cleaning step this project shipped with, reproduced exactly (commit
 * e33bc56 removed it): lowercase, drop digits, keep only a-z and whitespace,
 * collapse whitespace. It ran over the whole dataset before the split, so
 * this is what a sentence became in the original model's training data.
 */
export function legacyClean(text) {
  return String(text)
    .toLowerCase()
    .replace(/\p{Nd}+/gu, "")
    .replace(PY_NOT_A_Z_OR_SPACE, "")
    .replace(PY_SPACE_RUN, " ")
    .trim();
}

/**
 * Share of the letters (and the marks attached to them) that the legacy
 * cleaning kept, 0 to 1, or null when there are no letters to keep.
 * Punctuation and digits are not counted: both cleanings drop them, so
 * counting them would blame the old one for losses the new one makes too.
 */
export function legacyKept(text) {
  const letters = (s) => (String(s).match(/[\p{L}\p{M}]/gu) || []).length;
  const total = letters(text);
  return total === 0 ? null : letters(legacyClean(text)) / total;
}

/**
 * Split `cleaned` into runs, each marked with the strongest evidence n-gram
 * covering it (or none). Only n-grams that pushed toward the winner count,
 * and only the `top` strongest, so the text is not painted end to end.
 *
 * Matched on code points, the unit the detector counts n-grams in, then
 * widened to whole characters as written. Returns [{ text, strength }] with strength in [0, 1], 0 meaning unmarked.
 */
export function highlightRuns(cleaned, evidence, top = 6) {
  const chars = Array.from(cleaned);
  const chosen = evidence.filter((e) => e.contribution > 0 && e.ngram && e.ngram.trim()).slice(0, top);
  const max = chosen[0]?.contribution || 1;
  const strength = new Array(chars.length).fill(0);

  for (const e of chosen) {
    const gram = Array.from(e.ngram);
    const s = e.contribution / max;
    for (let i = 0; i + gram.length <= chars.length; i += 1) {
      let match = true;
      for (let k = 0; k < gram.length; k += 1) {
        if (chars[i + k] !== gram[k]) { match = false; break; }
      }
      if (!match) continue;
      for (let k = 0; k < gram.length; k += 1) {
        if (chars[i + k].trim()) strength[i + k] = Math.max(strength[i + k], s);
      }
    }
  }

  // Marked in whole grapheme clusters, not code points. The strongest
  // n-grams in Indic scripts are often a lone combining mark (the virama),
  // and wrapping a mark in its own element apart from its base letter breaks
  // how the script is shaped. A cluster takes its strongest code point.
  const runs = [];
  let offset = 0;
  for (const cluster of graphemes(cleaned)) {
    const width = Array.from(cluster).length;
    let s = 0;
    for (let k = 0; k < width; k += 1) s = Math.max(s, strength[offset + k]);
    offset += width;
    const last = runs[runs.length - 1];
    if (last && last.strength === s) last.text += cluster;
    else runs.push({ text: cluster, strength: s });
  }
  return runs;
}

function graphemes(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (g) => g.segment);
  }
  // A mark stays with the letter before it; only a mark with no letter
  // before it stands alone.
  return text.match(/\P{M}\p{M}*|\p{M}+/gu) || [];
}

/** True when the top two languages are too close to call with confidence. */
export function isCloseCall(ranked, margin = 0.15) {
  if (!ranked || ranked.length < 2) return false;
  return ranked[0].probability - ranked[1].probability < margin;
}
