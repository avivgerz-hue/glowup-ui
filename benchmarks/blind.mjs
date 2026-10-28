#!/usr/bin/env node
// Prepare a blinded comparison: copies each condition's contact sheet under shuffled neutral names and writes the key
// to a separate file. Score from the images first; open key.json only after the scores are written down.
//   node blind.mjs --scenario A [--labels baseline,current] [--seed 7]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({ options: { scenario: { type: "string" }, labels: { type: "string", default: "baseline,current" }, seed: { type: "string", default: "1" } } });
if (!values.scenario) { console.error("--scenario required"); process.exit(64); }
let s = Number(values.seed) || 1;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const labels = values.labels.split(",").filter((l) => fs.existsSync(path.join(HERE, "results", values.scenario, l, "screens", "after", "contact-sheet.png")));
const shuffled = [...labels].sort(() => rnd() - 0.5);
const out = path.join(HERE, "results", values.scenario, "blind");
fs.mkdirSync(out, { recursive: true });
const key = {};
shuffled.forEach((label, i) => {
  const name = String.fromCharCode(65 + i);
  fs.copyFileSync(path.join(HERE, "results", values.scenario, label, "screens", "after", "contact-sheet.png"), path.join(out, `${name}.png`));
  key[name] = label;
});
fs.writeFileSync(path.join(out, "key.json"), JSON.stringify({ seed: values.seed, key }, null, 2));
console.log(`Blind sheets: ${Object.keys(key).map((n) => path.join(out, `${n}.png`)).join(", ")}\nKey written to ${path.join(out, "key.json")} (do not open it until you have scored).`);
