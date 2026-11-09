# Regenerating the example captures and marketing boards

Two separate steps, on a machine that can run a browser. Everything here was verified against
the committed scripts; the only thing I could not run is the browser itself (see "Why this isn't
already done").

---

## One-time setup

Requires **Node 20+** (Node 22 for the benchmarks' lockfile) and Git.

```bash
git clone https://github.com/avivgerz-hue/glowup-ui.git
cd glowup-ui

cd benchmarks
npm ci --no-audit --no-fund
npx playwright install --with-deps chromium
```

That installs Playwright 1.62.1 and Chromium — the same two steps CI runs.

---

## Step 1 — re-capture the screenshots

Run from `benchmarks/`:

```bash
node showcase.mjs --install
```

> **Give `--install` several minutes and expect no output while it works.**
> It runs three `npm ci` calls back to back with nothing printed between them, which looks
> exactly like a hang. If you do interrupt it (or your terminal does), finish the installs by
> hand and capture without the flag:
>
> ```bash
> (cd ../demo/before && npm ci --no-audit --no-fund)
> (cd ../demo/after  && npm ci --no-audit --no-fund)
> (cd ../demo/create-ledger && npm ci --no-audit --no-fund)
> node showcase.mjs
> ```
>
> Because a failed or interrupted run now writes nothing into `assets/examples/`, stopping it
> half-way costs you nothing but time.

`--install` runs each demo's locked `npm ci`; without it the script refuses to run and tells you
dependencies are missing. It then launches one Chromium, checks the behaviour contracts, and
writes eight fresh images plus `evidence.json` into `assets/examples/`:

```
create-desktop.png          create-mobile.png
transform-before-desktop.png  transform-before-mobile.png
transform-after-desktop.png   transform-after-mobile.png
refine-after-desktop.png      refine-after-mobile.png
evidence.json
```

Use `--out DIR` to write somewhere else first if you want to inspect before overwriting.

**Wait for it to finish.** It asserts the apps still pass their tests and that the captures match
the documented viewports. If it throws, nothing is written to `assets/examples/` — the committed
evidence is left byte-identical and the failure goes to `benchmarks/results/showcase/failure.json`.
(Earlier versions overwrote the committed `evidence.json` with `pass: false`, which then failed
the gallery tests and made a broken run look like a broken repository.)

---

## Step 2 — rebuild the marketing boards

Back at the repository root:

```bash
cd ..
npm i --no-save sharp
node benchmarks/marketing-boards.mjs
```

Writes `assets/marketing/hero-desktop.png` and `hero-phone.png` by **compositing the captures you
just made** — it does not redraw the app. Every number on the boards (rule count, test count,
browser version) is read from its source at render time.

---

## Step 3 — verify before committing

```bash
npm test                        # 196 tests
node bin/glowup-ui.mjs validate # skill spec
git diff --stat                 # should be assets/examples/*, assets/marketing/*, nothing else
```

Then look at the images. Nothing automated judges whether a screenshot *looks* right — that is
still your eyes.

```bash
git add assets/examples assets/marketing assets/marketing/README.md
git commit -m "chore: refresh example captures and marketing boards"
```

---

## Why this isn't already done

The three steps above all work here. The browser download does not: this sandbox gets
`ECONNRESET` from the Playwright CDN and `ENOTFOUND` for `cdn.playwright.dev`, and there is no
Chromium on the image. So the committed captures are from **Chromium 154** and predate the
v0.1.2 fixes.

Regenerating them is the one task in this project that genuinely needs a machine you control.

---

## If something goes wrong

| symptom | cause |
|---|---|
| `Demo dependencies missing. Use --install explicitly` | you omitted `--install` |
| `Playwright is not installed.` | `npm ci` or `npx playwright install` didn't finish in `benchmarks/` |
| `Expected edit did not execute: E pages/Dashboard.jsx` | `demo/after` was altered; it must keep the defects the REFINE demo repairs |
| `npm ci` fails on a version mismatch | use the Node version in `benchmarks/package-lock.json`'s engines, i.e. 22 |

**Do not "fix" a defect in `demo/after/`.** That directory is the *before* state of the REFINE
demo — the unlabelled scroll region and similar warts are what the demo exists to repair. A test
asserts they are still present.
