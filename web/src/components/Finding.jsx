import React from "react";
import Panel from "./Panel.jsx";
import { label } from "../labels";
import "./Finding.css";

// Measured end to end on the same held-out rows, each model given exactly
// what its own version of the app handed it.
const ROWS = [
  ["Tamil", 93, 0.0, 100.0], ["Kannada", 73, 0.0, 100.0],
  ["Malayalam", 118, 0.0, 100.0], ["Arabic", 106, 0.0, 100.0],
  ["Greek", 72, 0.0, 100.0], ["Hindi", 12, 0.0, 100.0],
  ["Russian", 138, 0.0, 98.6], ["Danish", 85, 72.9, 96.5],
  ["German", 93, 84.9, 98.9], ["Dutch", 108, 90.7, 99.1],
  ["Turkish", 94, 91.5, 100.0], ["Portugeese", 147, 92.5, 98.0],
  ["Sweedish", 135, 92.6, 99.3], ["Spanish", 163, 96.9, 98.8],
  ["Italian", 139, 97.8, 100.0], ["French", 201, 98.5, 98.5],
  ["English", 277, 98.9, 98.6],
];

export default function Finding() {
  return (
    <Panel className="finding" aria-labelledby="finding-heading">
      <p className="eyebrow">What was wrong</p>
      <h2 id="finding-heading">A language detector that only worked in the English alphabet</h2>

      <div className="finding-grid">
        <div className="finding-text">
          <p>
            The cleaning step ran <code>re.sub(r'[^a-z\s]', '', text)</code>, which
            keeps lowercase ASCII and discards everything else. On a corpus of
            seventeen languages that is not cleaning, it is a filter. It left{" "}
            <b>0.2% of the characters</b> in the Tamil rows and blanked 98.1% of
            them outright. Across the corpus it destroyed <b>27.5% of the data</b>,
            and every destroyed row belonged to a non-Latin script.
          </p>
          <p>
            The model was then asked to separate seventeen languages using
            training data in which seven of them were empty strings. It scored
            exactly <b>0%</b> on all seven while reporting 66% overall, because
            the ten Latin-script languages carried the average. A second bug
            hid it further: the app passed raw text straight to a model trained
            on cleaned text, so training and serving never agreed.
          </p>
          <p>
            Fixing the filter exposed a third problem rather than solving
            everything. Letting the scripts through grew the feature space from
            ASCII to 44,000 n-grams, and the default smoothing spread so much
            mass across it that small classes could not win: German fell to 16%,
            three quarters of it predicted English, the largest class. Uniform
            class priors fixed that. A language detector should not assume
            English is more likely.
          </p>
        </div>

        <figure className="finding-table">
          <figcaption>Per language, before and after</figcaption>
          <div className="ft-head"><span>Language</span><span>before</span><span>after</span></div>
          <ul>
            {ROWS.map(([name, n, before, after]) => (
              <li key={name}>
                <span className="ft-name">{label(name)}</span>
                <span className={`ft-val ${before === 0 ? "zero" : ""}`}>{before.toFixed(1)}%</span>
                <span className="ft-val good">{after.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
          <p className="ft-total">
            <span>Overall</span><span className="ft-val">65.8%</span><span className="ft-val good">98.9%</span>
          </p>
          <p className="ft-foot">
            Seven languages scored zero before and none do now. The worst
            language went from 0% to 96.5%. The headline moved from 65.8% to
            98.9%, but that is the least interesting number here: the original
            66% was not a model that needed improving, it was a pipeline
            reporting an average over data it had deleted.
          </p>
        </figure>
      </div>
    </Panel>
  );
}
