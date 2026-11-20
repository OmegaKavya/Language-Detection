import React from "react";
import ThemeToggle from "./ThemeToggle.jsx";
import "./Hero.css";

// The scripts themselves are the decoration, because they are the subject.
const SCRIPTS = ["Aa", "Бб", "Αα", "ع", "अ", "அ", "ಅ", "മ"];

export default function Hero() {
  return (
    <header className="hero">
      <ThemeToggle />
      <div className="hero-inner shell">
        <p className="hero-scripts" aria-hidden="true">
          {SCRIPTS.map((s) => <span key={s}>{s}</span>)}
        </p>

        <h1>Which language is this?</h1>

        <p className="hero-tag">
          Seventeen languages, told apart by their character patterns alone.
          The model runs entirely in this tab: no server, no request, no wait.
        </p>

        <dl className="hero-stats">
          <div>
            <dt className="win">99.1%</dt>
            <dd>on held-out text, with the worst language at 96.5%</dd>
          </div>
          <div>
            <dt className="fail">7 of 17</dt>
            <dd>languages the original version scored exactly zero on</dd>
          </div>
          <div>
            <dt className="win">0 ms</dt>
            <dd>network time, because nothing leaves your browser</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
