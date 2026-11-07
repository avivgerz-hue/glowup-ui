# See the work, inspect the evidence

All images here are fresh Chromium renders from the **current clean repository**, with fictional sample data. No imagery or assets were imported from a retired repository. These examples show what the tools and workflows can support, not a measured advantage over an unassisted agent.

## Gather — a working four-screen application

The new leading example has Overview, Events, Guests, Settings and a working event/RSVP dialog, original inline SVG artwork, event/guest filters, capacity/duplicate/invalid-RSVP handling, local persistence and theme preferences. [Run either version](../demo/gather/README.md).

The baseline was built by a fresh-context agent without a design skill. Another agent received an identical source copy, explicitly read the full Glowup **0.2.0-dev.1** entry and selected references, and transformed the shared shell, screen compositions, phone guest rows, settings and dialog. It retained the original domain module, six tests, content and assets. A small theme-token repair fixes inherited unreadable dark headings. This is the earlier dev.1 implementation, not the dev.2 routing rerun.

Both versions pass the original domain tests/build and a common desktop/phone browser journey for invalid/valid RSVP, guest persistence, search/empty states and preferences. Sixteen matching screen captures use fixed data/clock/theme/scroll at 1440×900/390×844. Dialog outcomes are also exercised; `--out NEW_DIRECTORY` retains all twenty captures including dialogs. The public gallery keeps lighter screen images rather than large blurred-modal PNGs. [Sanitized capture/source evidence](../assets/examples/gather/evidence.json). The local [comparison gallery](../assets/examples/gather/index.html) switches screens and viewports; open it from a checkout or the downloadable test kit.

Reproduce from the repository root under Node22 with the benchmark dependencies and available Chromium: `node benchmarks/gather-showcase.mjs --check`. `--write` deliberately replaces the public captures. Nothing installs a browser silently. Browser launch uses Playwright defaults inside the execution environment, not an enabled Chromium OS sandbox.

**Limits:** this is an additional editing pass, not an equal-budget control/treatment experiment. No native host activation, independent human rating, superiority or speedup is established. Phone RSVP requires scrolling and complete guest cards occupy more height. The older examples below remain available with their original provenance.

## CREATE — Margin

[Source and brief](../demo/create-ledger/README.md) · [desktop](../assets/examples/create-desktop.png) · [phone](../assets/examples/create-mobile.png)

Maintainer-directed Codex implementation in this PR, after explicitly reading CREATE and the finance composition recipe. Vanilla browser code; no backend, bank connection, paid service or dependency. One dominant balance/trend region, quiet monthly context, aligned amounts and shared responsive navigation. Search, combined category filtering, local persistence, transaction validation and preferences are exercised in the browser. This is not an authenticated native-CLI skill test or an independent model comparison.

## TRANSFORM — Plotline

[Before source](../demo/before) · [after source](../demo/after) · [desktop before](../assets/examples/transform-before-desktop.png) · [desktop after](../assets/examples/transform-after-desktop.png)

The bundled maintainer fixture pair is freshly rendered with identical project/member/activity data. The two versions retain their original 12 behavior tests. The original phone view has pre-existing document overflow; its before capture preserves and records that defect rather than hiding it. The redesigned phone view must fit the viewport. Composition, typography, navigation, shared components, illustrations and data presentation differ substantially. We do not certify the earlier visual implementation as an authenticated autonomous skill run. Its provenance here is the included source, the successful tests and the new capture record.

## REFINE — retain the identity

[Before](../assets/examples/transform-after-desktop.png) · [after](../assets/examples/refine-after-desktop.png) · [phone after](../assets/examples/refine-after-mobile.png)

Controlled script `improve(E)` in `benchmarks/lib/refine-edits.mjs` modifies an isolated copy of the already-designed app. It increases the logout hit area and makes the chart a named keyboard-scrollable region. The palette, typography, logo, data and original behavior tests remain intact. The visual difference is intentionally modest; the behavior changes are checked separately. This is a scripted refinement, not an agent-quality result.

## Reproduce

With Node 22 and benchmark Playwright installed, select an existing Chromium or explicitly install Playwright Chromium, then:

```bash
GLOWUP_BROWSER_EXECUTABLE=/usr/bin/chromium node benchmarks/showcase.mjs --install
```

`--install` explicitly runs the bundled apps' locked `npm ci`. Default output is `assets/examples/`. The script tests/builds both TRANSFORM versions and REFINE, tests the CREATE model and interactions, checks data/brand preservation, captures identical 1440×900 / 390×844 light-mode views, and writes [evidence.json](../assets/examples/evidence.json). The REFINE baseline reuses the TRANSFORM-after images. Every capture has a hash and source provenance; CI uses `--check` to exercise the examples and reject stale source/image hashes without rewriting committed assets.

No blind scores are assigned. To measure actual agent influence, use the [paired evaluation procedure](../benchmarks/PAIRED-EVALUATION.md) and independent reviewers.
