import test from "node:test";
import assert from "node:assert";
import { legacyClean, legacyKept, highlightRuns, isCloseCall } from "./explain.js";

test("the legacy cleaning erases non-Latin scripts entirely", () => {
  assert.strictEqual(legacyClean("வணக்கம் உலகம்"), "");
  assert.strictEqual(legacyKept("வணக்கம் உலகம்"), 0);
  assert.strictEqual(legacyClean("Hello, World 2024!"), "hello world");
  assert.strictEqual(legacyKept("hello"), 1);
});

test("accented Latin loses its accented letters", () => {
  assert.strictEqual(legacyClean("Ça va très bien"), "a va trs bien");
});

test("highlights cover each occurrence of the strongest n-grams", () => {
  const runs = highlightRuns("the cat the", [
    { ngram: "the", contribution: 2 },
    { ngram: "cat", contribution: 1 },
    { ngram: "xyz", contribution: -5 },
  ]);
  assert.strictEqual(runs.map((r) => r.text).join(""), "the cat the");
  assert.deepStrictEqual(
    runs.map((r) => [r.text, r.strength]),
    [["the", 1], [" ", 0], ["cat", 0.5], [" ", 0], ["the", 1]]
  );
});

test("a highlighted mark takes its whole written character with it", () => {
  // The virama alone is the n-gram; the highlight must not split "க்".
  const runs = highlightRuns("வணக்கம்", [{ ngram: "\u0BCD", contribution: 1 }]);
  assert.strictEqual(runs.map((r) => r.text).join(""), "வணக்கம்");
  const marked = runs.filter((r) => r.strength > 0).map((r) => r.text);
  assert.ok(marked.includes("க்"), JSON.stringify(runs));
  for (const r of runs) assert.ok(!/^\p{M}/u.test(r.text), `run starts with a bare mark: ${r.text}`);
});

test("close calls are flagged by margin, not by length", () => {
  assert.strictEqual(isCloseCall([{ probability: 0.5 }, { probability: 0.4 }]), true);
  assert.strictEqual(isCloseCall([{ probability: 0.9 }, { probability: 0.05 }]), false);
});

test("punctuation is not counted as lost letters", () => {
  assert.strictEqual(legacyKept("The park."), 1);
  assert.strictEqual(legacyKept("très"), 0.75);
});

test("text with no letters has nothing to keep, not 100% kept", () => {
  assert.strictEqual(legacyKept("2024!"), null);
  assert.strictEqual(legacyKept("... ???"), null);
  assert.strictEqual(legacyClean("2024!"), "");
});

test("the legacy cleaning uses Python's whitespace, not JavaScript's", () => {
  // Every character Python 3's \s matches on str, which is str.isspace.
  const python = [0x9, 0xa, 0xb, 0xc, 0xd, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x85, 0xa0, 0x1680,
    0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a,
    0x2028, 0x2029, 0x202f, 0x205f, 0x3000];
  for (const c of python) {
    assert.strictEqual(legacyClean(`a${String.fromCodePoint(c)}b`), "a b", `U+${c.toString(16)}`);
  }
  // JavaScript's \s matches U+FEFF; Python's does not, so the old rule deleted it.
  assert.strictEqual(legacyClean("a\ufeffb"), "ab");
});

test("without Intl.Segmenter, a mark still stays with its letter", () => {
  const segmenter = Intl.Segmenter;
  delete Intl.Segmenter;
  try {
    const runs = highlightRuns("வணக்கம்", [{ ngram: "\u0BCD", contribution: 1 }]);
    assert.strictEqual(runs.map((r) => r.text).join(""), "வணக்கம்");
    assert.deepStrictEqual(runs.filter((r) => r.strength > 0).map((r) => r.text), ["க்", "ம்"]);
    for (const r of runs) assert.ok(!/^\p{M}/u.test(r.text), `run starts with a bare mark: ${r.text}`);
  } finally {
    Intl.Segmenter = segmenter;
  }
});
