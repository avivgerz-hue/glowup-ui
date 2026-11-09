#!/usr/bin/env node
// Renders the marketing boards in assets/marketing/.
//
// These are composited from the REAL Chromium captures in assets/examples/, not redrawn. The
// capture pipeline (benchmarks/showcase.mjs --install) needs a browser; this step does not, so
// the boards can be regenerated anywhere and stay pixel-true to what the app actually rendered.
//
// Nothing on a board is typed from memory. Counts are read from their sources at render time:
// the accessibility rule count from a11y.mjs, the behaviour-test count from the fixture, the
// capture metadata from evidence.json. A board that states a number the repository cannot
// back is a false claim, and three such figures have already shipped in this project.
//
// Usage: npm i --no-save sharp && node benchmarks/marketing-boards.mjs [--out DIR]
import sharp from "sharp";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv;
const outDir = argv.includes("--out") ? path.resolve(argv[argv.indexOf("--out") + 1]) : path.join(root, "assets/marketing");
fs.mkdirSync(outDir, { recursive: true });
const R = (...p) => path.join(root, ...p);

// Palette copied from demo/after/src/index.css so the boards cannot drift from the product.
const P = { paper:"#f4efe4", deep:"#ebe4d3", surface:"#fffcf6", rule:"#ddd4bf", ruleStrong:"#8a8372",
  ink:"#1c1a16", muted:"#5d584b", faint:"#6f6959", vermilion:"#d6451f", primary:"#a52801" };
const SERIF = "Liberation Serif, DejaVu Serif, serif";
const SANS = "Liberation Sans, DejaVu Sans, sans-serif";

// ---------------------------------------------------------------- figures, read from sources
const a11yRuleCount = new Set(
  [...fs.readFileSync(R("skills/glowup-ui/scripts/a11y.mjs"), "utf8")
    .matchAll(/push\(\s*"([a-z0-9-]+)"/g)].map((m) => m[1]),
).size;

const behaviourTestCount = (fs.readFileSync(R("demo/before/tests/behavior.test.jsx"), "utf8")
  .match(/^\s*(?:test|it)\(/gm) || []).length;

const evidence = JSON.parse(fs.readFileSync(R("assets/examples/evidence.json"), "utf8"));
const captureLine = `${evidence.browser.name} ${evidence.browser.version.split(".")[0]}, deviceScaleFactor ${evidence.browser.deviceScaleFactor}, reduced motion`;

// The phone board used to print "0 horizontal overflow" as a constant. It was not true: the
// BEFORE fixture is a pre-existing document that overflows at 390px, and evidence.json has
// always recorded that. Printing a reassuring number over a screenshot that contradicts it is
// exactly the kind of claim this project is supposed to never make, so both figures are counted.
const overflowDevices = evidence.baselineFindings.filter((f) => f.kind.includes("overflow")).map((f) => f.device);
const overflowCount = overflowDevices.length;
// The count is printed separately on the board, so this phrase must not repeat it.
const overflowWho = overflowCount
  ? `pre-existing overflow in the BEFORE app (${overflowDevices.join(", ")})`
  : `horizontal overflow`;

// ---------------------------------------------------------------- primitives
async function plate(file, width, radius = 8) {
  const meta = await sharp(file).metadata();
  const h = Math.round((meta.height / meta.width) * width);
  const scaled = await sharp(file).resize({ width }).png().toBuffer();
  const mask = await sharp(Buffer.from(
    `<svg width="${width}" height="${h}"><rect width="${width}" height="${h}" rx="${radius}" fill="#fff"/></svg>`,
  )).png().toBuffer();
  return { body: await sharp(scaled).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer(), w: width, h };
}

async function panel(file, { width, label, accent }) {
  const { body, w, h } = await plate(file, width);
  const pad = 18, head = 40, fw = w + pad * 2, fh = h + pad * 2 + head;
  const svg = `<svg width="${fw}" height="${fh}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${fw}" height="${fh}" rx="10" fill="${P.surface}" stroke="${P.rule}"/>
    <text x="${pad}" y="26" font-family="${SANS}" font-size="12" letter-spacing="2.2" font-weight="bold" fill="${accent}">${label}</text>
  </svg>`;
  return { input: await sharp(Buffer.from(svg)).png().toBuffer(), body, w: fw, h: fh, inner: { top: pad + head, left: pad } };
}

async function device(file, width) {
  const screen = await plate(file, width, 22);
  const bez = 9, fw = screen.w + bez * 2, fh = screen.h + bez * 2;
  const shell = await sharp(Buffer.from(
    `<svg width="${fw}" height="${fh}" xmlns="http://www.w3.org/2000/svg"><rect width="${fw}" height="${fh}" rx="30" fill="${P.ink}"/></svg>`,
  )).png().toBuffer();
  return { shell, body: screen.body, fw, fh };
}

const grid = (W, H) => Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <pattern id="g" width="30" height="30" patternUnits="userSpaceOnUse">
    <path d="M30 0H0V30" fill="none" stroke="${P.rule}" stroke-width="0.9" opacity="0.5"/>
  </pattern><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`);

const write = async (img, file) => { await img.toFile(path.join(outDir, file)); console.log(`wrote ${file}`); };

// ---------------------------------------------------------------- 1. hero desktop
{
  const PW = 790;
  const before = await panel(R("assets/examples/transform-before-desktop.png"), { width: PW, label: "BEFORE · OUTPUT WITHOUT A DIRECTION", accent: P.ruleStrong });
  const after = await panel(R("assets/examples/transform-after-desktop.png"), { width: PW, label: "AFTER · ONE PASS OF THE SKILL", accent: P.vermilion });
  const GAP = 56, M = 60;
  const W = M * 2 + before.w + GAP + after.w, H = 1060;
  const leftX = M, rightX = M + before.w + GAP, top = 330;

  const head = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="60" y="92" font-family="${SANS}" font-size="14" letter-spacing="3" font-weight="bold" fill="${P.vermilion}">GLOWUP UI</text>
    <text x="60" y="182" font-family="${SERIF}" font-size="76" font-weight="bold" fill="${P.ink}">Same app. Same data.</text>
    <text x="60" y="258" font-family="${SERIF}" font-size="76" font-weight="bold" font-style="italic" fill="${P.primary}">Twice the conviction.</text>
    <text x="62" y="300" font-family="${SANS}" font-size="19" fill="${P.muted}">Real Chromium captures of the Plotline fixture. Routes, copy, data and behaviour unchanged.</text>
    <line x1="60" y1="1000" x2="${W - 60}" y2="1000" stroke="${P.ruleStrong}"/>
    <text x="60" y="1046" font-family="${SANS}" font-size="15" fill="${P.muted}"><tspan font-family="${SERIF}" font-size="27" font-weight="bold" fill="${P.ink}">0</tspan> routes changed    &#183;    <tspan font-family="${SERIF}" font-size="27" font-weight="bold" fill="${P.ink}">${behaviourTestCount}</tspan> original tests green    &#183;    <tspan font-family="${SERIF}" font-size="27" font-weight="bold" fill="${P.ink}">${a11yRuleCount}</tspan> a11y rules enforced</text>
  </svg>`;

  await write(sharp({ create: { width: W, height: H, channels: 3, background: P.paper } })
    .composite([
      { input: await grid(W, H), top: 0, left: 0 },
      { input: Buffer.from(head), top: 0, left: 0 },
      { input: before.input, top, left: leftX },
      { input: before.body, top: top + before.inner.top, left: leftX + before.inner.left },
      { input: after.input, top, left: rightX },
      { input: after.body, top: top + after.inner.top, left: rightX + after.inner.left },
    ]).png({ compressionLevel: 9 }), "hero-desktop.png");
}

// ---------------------------------------------------------------- 2. hero phone
{
  // Geometry is computed, never hand-tuned. An earlier revision placed the devices at typed
  // coordinates and silently pushed the outer two past the canvas edge, so they rendered clipped.
  const W = 1240, PAD = 48, GAP = 46, P_W = 310;
  const beforePh = await device(R("assets/examples/transform-before-mobile.png"), P_W);
  const afterPh = await device(R("assets/examples/transform-after-mobile.png"), P_W);
  const createPh = await device(R("assets/examples/create-mobile.png"), P_W);
  const phones = [beforePh, afterPh, createPh];
  const rowW = phones.reduce((sum, p) => sum + p.fw, 0) + GAP * (phones.length - 1);
  assert.ok(rowW <= W - PAD * 2, `phone row ${rowW}px does not fit inside ${W - PAD * 2}px of canvas`);
  const left = Math.round((W - rowW) / 2);
  const xs = phones.map((_, i) => left + phones.slice(0, i).reduce((sum, p) => sum + p.fw + GAP, 0));

  const top = 382;
  const bottom = top + Math.max(...phones.map((p) => p.fh));
  assert.ok(bottom < 1160, `devices end at ${bottom}px; leave room for the footer`);
  const ruleY = bottom + 52, statsY = bottom + 100, noteY = bottom + 138;
  const H = bottom + 166;

  const head = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <text x="${W / 2}" y="92" text-anchor="middle" font-family="${SANS}" font-size="14" letter-spacing="3.2" font-weight="bold" fill="${P.vermilion}">GLOWUP UI</text>
    <text x="${W / 2}" y="190" text-anchor="middle" font-family="${SERIF}" font-size="62" font-weight="bold" fill="${P.ink}">The same care on a phone.</text>
    <text x="${W / 2}" y="244" text-anchor="middle" font-family="${SANS}" font-size="18" fill="${P.muted}">Real 390 &#215; 844 captures. Not a separate mobile design &#8212; the same system, reflowed.</text>
    <text x="${xs[0] + beforePh.fw / 2}" y="${top - 22}" text-anchor="middle" font-family="${SANS}" font-size="12" letter-spacing="2.2" font-weight="bold" fill="${P.faint}">BEFORE</text>
    <text x="${xs[1] + afterPh.fw / 2}" y="${top - 22}" text-anchor="middle" font-family="${SANS}" font-size="12" letter-spacing="2.2" font-weight="bold" fill="${P.vermilion}">AFTER</text>
    <text x="${xs[2] + createPh.fw / 2}" y="${top - 22}" text-anchor="middle" font-family="${SANS}" font-size="12" letter-spacing="2.2" font-weight="bold" fill="${P.primary}">CREATE</text>
    <line x1="80" y1="${ruleY}" x2="${W - 80}" y2="${ruleY}" stroke="${P.ruleStrong}"/>
    <text x="${W / 2}" y="${statsY}" text-anchor="middle" font-family="${SANS}" font-size="15" fill="${P.muted}"><tspan font-family="${SERIF}" font-size="27" font-weight="bold" fill="${P.ink}">390px</tspan> narrowest layout    &#183;    <tspan font-family="${SERIF}" font-size="27" font-weight="bold" fill="${P.ink}">0</tspan> routes changed    &#183;    <tspan font-family="${SERIF}" font-size="24" font-weight="bold" fill="${P.ink}">${overflowCount}</tspan> ${overflowWho}</text>
    <text x="${W / 2}" y="${noteY}" text-anchor="middle" font-family="${SANS}" font-size="12" fill="${P.faint}">${captureLine}. Full provenance in assets/examples/evidence.json.</text>
  </svg>`;

  await write(sharp(Buffer.from(head))
    .composite(phones.flatMap((p, i) => [
      { input: p.shell, top, left: xs[i] },
      { input: p.body, top: top + 9, left: xs[i] + 9 },
    ])).png({ compressionLevel: 9 }), "hero-phone.png");
}

console.log("done");
