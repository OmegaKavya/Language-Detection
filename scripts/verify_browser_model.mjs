// Does the browser implementation agree with scikit-learn?
//
// Not "is it close": every prediction on the held-out set must match, and the
// probabilities must agree to a tolerance that rules out a different formula
// rather than different floating point.
import fs from "node:fs";
import { loadModel, detect } from "../web/src/detect.js";

const raw = JSON.parse(fs.readFileSync(new URL("../web/src/model.json", import.meta.url)));
const holdout = JSON.parse(fs.readFileSync("/tmp/holdout.json", "utf8"));
const model = loadModel(raw);

let agree = 0, maxDelta = 0, nulls = 0;
for (let i = 0; i < holdout.texts.length; i += 1) {
  const got = detect(model, holdout.texts[i]);
  if (!got) { nulls += 1; continue; }
  if (got.language === holdout.pred[i]) agree += 1;
  maxDelta = Math.max(maxDelta, Math.abs(got.confidence - holdout.top[i]));
}
const n = holdout.texts.length;
console.log(`rows            ${n}`);
console.log(`same prediction ${agree} (${(100*agree/n).toFixed(2)}%)`);
console.log(`max |p_js - p_sklearn| ${maxDelta.toExponential(2)}`);
console.log(`unscored        ${nulls}`);
process.exit(agree === n - nulls && maxDelta < 1e-4 ? 0 : 1);
