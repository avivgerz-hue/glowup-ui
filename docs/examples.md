# See the work, inspect the evidence

All images here are fresh Chromium renders from the **current clean repository**, with fictional sample data. No imagery or assets were imported from a retired repository. These examples show what the tools and workflows can support, not a measured advantage over an unassisted agent.

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
