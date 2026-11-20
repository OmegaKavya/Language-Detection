import React, { useEffect, useMemo, useRef, useState } from "react";
import Panel from "./Panel.jsx";
import { SAMPLES } from "../samples";
import { label } from "../labels";
import "./Detector.css";

const pct = (v) => `${(100 * v).toFixed(1)}%`;

// The whole app, really: a textarea and a verdict that updates as you type.
// There is no request to wait for, so there is no loading state and no
// button; the result simply keeps up with the keyboard.
export default function Detector({ model, detect }) {
  const [text, setText] = useState("");
  const areaRef = useRef(null);

  useEffect(() => {
    // Start on a sample, so the page is never a blank box.
    setText(SAMPLES[0].text);
  }, []);

  const result = useMemo(
    () => (model && text.trim() ? detect(model, text) : null),
    [model, text, detect]
  );

  const chars = text.trim().length;
  const thin = result && chars < 12;

  return (
    <Panel className="detector" aria-labelledby="detector-heading">
      <h2 id="detector-heading" className="visually-hidden">Detect a language</h2>

      <textarea
        ref={areaRef}
        className="detector-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste anything in one of seventeen languages."
        spellCheck="false"
        aria-label="Text to identify"
      />

      <div className="detector-samples">
        <span className="detector-samples-label">Try</span>
        <div className="detector-chips">
          {SAMPLES.map((s) => (
            <button key={s.language} type="button" className="chip"
              onClick={() => { setText(s.text); areaRef.current?.focus(); }}>
              {label(s.language)}
            </button>
          ))}
        </div>
      </div>

      {!model && <p className="detector-status">Loading the model into your browser…</p>}

      {model && !result && (
        <p className="detector-status">Nothing to read yet. Type something above.</p>
      )}

      {result && (
        <div className="detector-result" aria-live="polite">
          <div className="verdict">
            <p className="eyebrow">This looks like</p>
            <h3>{label(result.language)}</h3>
            <p className="verdict-conf">
              {pct(result.confidence)} confident, against{" "}
              <b>{label(result.against)}</b> as the next best fit.
            </p>
            {thin && (
              <p className="verdict-warn">
                Only {chars} characters to go on. Short strings are genuinely
                ambiguous, and the confidence above should be read as the
                model's, not as a fact about the text.
              </p>
            )}
          </div>

          <div className="ranked">
            <p className="ranked-label">All seventeen, ranked</p>
            <ul>
              {result.ranked.slice(0, 6).map((row, i) => (
                <li key={row.language} className={i === 0 ? "top" : ""}>
                  <span className="ranked-name">{label(row.language)}</span>
                  <span className="ranked-track">
                    <span className="ranked-bar" style={{ width: `${Math.max(0.4, 100 * row.probability)}%` }} />
                  </span>
                  <span className="ranked-value">{pct(row.probability)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {result && result.evidence.length > 0 && (
        <div className="evidence">
          <p className="ranked-label">
            Why {label(result.language)} and not {label(result.against)}
          </p>
          <p className="evidence-note">
            The character sequences that moved the decision, and by how much.
            This is the model's own arithmetic, not a description of it: each
            bar is one n-gram's weight times the difference it makes between
            the two languages.
          </p>
          <ul className="evidence-list">
            {result.evidence.slice(0, 8).map((e) => {
              const max = result.evidence[0].contribution || 1;
              return (
                <li key={e.column}>
                  <code>{e.ngram === " " ? "␣" : e.ngram.replace(/ /g, "␣")}</code>
                  <span className="evidence-track">
                    <span className="evidence-bar"
                      style={{ width: `${Math.max(2, 100 * (e.contribution / max))}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Panel>
  );
}
