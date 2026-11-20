import React, { useEffect, useState } from "react";
import Hero from "./components/Hero.jsx";
import Detector from "./components/Detector.jsx";
import Finding from "./components/Finding.jsx";
import Signature from "./components/Signature.jsx";
import "./App.css";

export default function App() {
  const [model, setModel] = useState(null);
  const [failed, setFailed] = useState(false);
  const [detect, setDetect] = useState(null);

  useEffect(() => {
    // The model is 2 MB, so it is a separate chunk fetched after first paint:
    // the page is readable immediately and becomes interactive a moment later.
    let live = true;
    (async () => {
      try {
        const [{ loadModel, detect: fn }, raw] = await Promise.all([
          import("./detect.js"),
          import("./model.json"),
        ]);
        if (!live) return;
        setDetect(() => fn);
        setModel(loadModel(raw.default ?? raw));
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => { live = false; };
  }, []);

  return (
    <>
      <Hero />
      <main className="shell">
        {failed ? (
          <p className="load-error" role="alert">
            The model could not be loaded, so nothing can be identified. A
            reload usually fixes it.
          </p>
        ) : (
          <Detector model={model} detect={detect} />
        )}
        <Finding />
      </main>
      <footer className="footer">
        <hr className="rule" />
        <Signature note="Built and measured end to end" />
        <p>
          <a href="https://github.com/OmegaKavya/Language-Detection">Source and method</a>
          <span aria-hidden="true"> · </span>
          <a href="https://aggarwalkavya.web.app">More work</a>
        </p>
      </footer>
    </>
  );
}
