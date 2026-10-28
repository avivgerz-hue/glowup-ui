// How much did the page change? Mean per-pixel difference and fraction of changed pixels
// between two screenshots of the same route and viewport. Measures transformation only,
// not quality: a worse design can also differ a lot.

import fs from "node:fs";
import { loadPlaywright, browserOptions } from "../../skills/glowup-ui/scripts/screenshot.mjs";

export async function pixelDiffs(pairs) {
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch(browserOptions());
  try {
    const page = await browser.newPage();
    const out = [];
    for (const { before, after, key } of pairs) {
      if (!fs.existsSync(before) || !fs.existsSync(after)) { out.push({ key, error: "missing screenshot" }); continue; }
      const a = fs.readFileSync(before).toString("base64");
      const b = fs.readFileSync(after).toString("base64");
      const r = await page.evaluate(async ({ a, b }) => {
        const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
        const [ia, ib] = await Promise.all([load("data:image/png;base64," + a), load("data:image/png;base64," + b)]);
        const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height, 2400);
        const px = (img) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
        const da = px(ia), db = px(ib);
        let sum = 0, changed = 0;
        for (let i = 0; i < da.length; i += 4) {
          const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3;
          sum += d; if (d > 24) changed++;
        }
        const n = da.length / 4;
        return { meanDiff: sum / n / 255, changedFraction: changed / n };
      }, { a, b });
      out.push({ key, meanDiff: Math.round(r.meanDiff * 1000) / 1000, changedFraction: Math.round(r.changedFraction * 1000) / 1000 });
    }
    return out;
  } finally {
    await browser.close();
  }
}
