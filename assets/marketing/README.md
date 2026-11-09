# Marketing boards

Composited from the **real Chromium captures** in [`assets/examples/`](../examples/). Not
redrawn — what you see is what the app actually rendered.

| file | size | use |
|---|---|---|
| `hero-desktop.png` | 1828×1060 | README hero, link preview, wide feed |
| `hero-phone.png` | 1240×1250 | phone comparison (before / after / CREATE) |

Regenerate with:

```bash
npm i --no-save sharp
node benchmarks/marketing-boards.mjs
```

## Where the numbers come from

Nothing on a board is typed from memory. At render time the generator reads:

- the accessibility rule count from `skills/glowup-ui/scripts/a11y.mjs`
- the behaviour-test count from `demo/before/tests/behavior.test.jsx`
- browser name, version and scale factor from `assets/examples/evidence.json`

Three figures in this project were wrong at some point because they were copied forward by
hand (17 vs 18 rules, 152 vs 182 tests, 315 vs 396px of blank fold). `tests/marketing-boards.test.mjs`
now fails the build if a board or its surrounding prose disagrees with its source.

## Scope

The boards show a controlled fixture edit produced by `benchmarks/showcase.mjs`, not a model
A/B benchmark. The README says so next to the images and must keep doing so — one test asserts
that label is present.

If you regenerate the captures on a machine with a browser, re-run the generator and both
boards update automatically.
