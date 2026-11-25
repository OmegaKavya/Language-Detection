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
