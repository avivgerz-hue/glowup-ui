# Marketing boards

Rendered comparison artwork for announcements. Not screenshots — see below.

| file | size | use |
|---|---|---|
| `comparison-desktop.png` | 1600×900 | link preview, wide feed, blog header |
| `comparison-phone.png` | 1080×1350 | portrait feed (4:5) |

Regenerate with:

```bash
npm i --no-save sharp
node benchmarks/marketing-boards.mjs
```

## What these are, and are not

They are **rendered illustrations** that restate the before/after comparison. The real
captures are in [`assets/examples/`](../examples/) and come from
`benchmarks/showcase.mjs --install`, which needs Chromium.

Every figure, name and line of copy on the boards is taken from the Plotline example in
`demo/after/src/`, and the colour palette is copied from `demo/after/src/index.css`. The
number of enforced accessibility rules is counted out of `a11y.mjs` at render time, so a
board cannot state a rule count the engine does not have.

The boards carry a visible provenance line for that reason. They are documentation of a
controlled fixture edit, not a model A/B benchmark, and `tests/marketing-boards.test.mjs`
binds them to those sources.
