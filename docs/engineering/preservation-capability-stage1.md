# Preservation and obscured-control verification — stage 1

This stage implements two reproduced mechanical failures against main `cb804d03cd5f0bf1073845dd8162eb3ce472745b`. It does not change PR #8 (`1d4e366`), redefine redesign depth, or claim the PocketFlow outcome is fixed.

The full owner-supplied research report was read as recommendations, not runtime evidence. Its reliability-first preservation/browser passes support this narrow scope. No report text or opaque citation claims are redistributed here.

## Executed comparisons

- A synthetic Save handler returned 11 before and 12 after while preserving its binding; the existing checkpoint passed. The same browser outcome contract now passes the original and fails the changed behavior. The checkpoint remains a useful independent heuristic, not a behavioral oracle.
- A synthetic bottom overlay intercepted navigation at 390×844 while the original rendered reviewer reported `clear`. The new regression first failed against the old sampler, then passed after bounded hit-testing was added. Covered controls now block rendered review on mobile and desktop.
- Removing the control fails the outcome flow. Extracting the button into a reusable render function preserves the outcome and passes both checkpoint and browser checks. This is a deliberately small vanilla fixture, not proof for every framework/refactor.
- Associated labels/descendants and intentional native-dialog background blocking do not produce obstruction failures.
- The actual flow CLI against a local HTTP fixture passes working navigation, fails broken navigation, and separately counts runtime and console errors without serializing their messages. Existing live browser review contracts still pass.

## What shipped in the candidate

`verify-flow.mjs` is an optional Node helper using the existing Playwright discovery/browser settings. It accepts a small local JSON sequence of clicks/fills and explicit rendered-text or URL outcomes. It requires an outcome assertion, bounds steps/timeouts, records a contract hash and fails on observed runtime/console errors. It does not execute code supplied in the JSON, install dependencies, infer expectations or replace original tests. Reuse the same pre-edit assertions, including when markup changes. Missing browser support must be reported as unverified.

Rendered measurement now samples five viewport-visible points on up to 200 enabled controls/non-inline links. If every point is intercepted on anchored/non-scrollable controls, review emits an `obscured-controls` blocker; scroll-dependent content gets a separate review finding. Truncation is a review finding; offscreen controls are skipped. Existing manifest version 1 remains readable because the new field is additive. Historical manifests lacking it do not establish obstruction coverage.

CREATE/REFINE guidance and transformation priorities remain intact; the canonical entry point adds only a tool pointer. The verification reference loads focused behavior guidance when needed. No dependency, installer, release metadata or application-source changes.

## Limits and next evidence

Sampling can miss partial obstruction, clipping and offscreen failures; intended custom overlays may need contextual review. The helper is not an accessibility audit or a semantic preservation proof. Flow expectations can themselves be wrong, and a flow cannot cover unspecified behavior. Browser assertions do not establish visual quality, full instruction delivery or transformation depth.

These are controlled tool/fixture regressions, not native-agent A/B/C trials. No new autonomous app was built and no PocketFlow files were accessed. No native activation, independent design scoring, throughput/token improvement or broad model advantage is claimed. Current/candidate/no-skill agent comparisons, richer screen/state coverage and design-direction changes remain separate evaluation work.

## Reproduce

```bash
npm test
node bin/glowup-ui.mjs validate
GLOWUP_BROWSER_EXECUTABLE=/path/to/chromium node benchmarks/preservation-browser.mjs
GLOWUP_BROWSER_EXECUTABLE=/path/to/chromium node benchmarks/review-browser.mjs
```

Use normally available Chromium/Playwright; do not disable the sandbox or silently install dependencies. `benchmarks` now includes the new regression in its existing `npm run test:browser` chain, so hosted browser CI runs it too. Fixture tests exercise real DOM and interactions, not an agent's instruction compliance. Generated/private evidence stays outside Git.

Scrollable normal-flow controls intercepted in the current view remain `obscured-scroll-content` review findings, not proven unreachable controls. Fixed/sticky controls and non-scrollable obstruction remain blockers. Newly introduced scroll-obstruction findings still register as regressions. A real browser fixture confirms that scrolling can reveal and activate an initially covered normal-flow button; this avoids making unchanged, scroll-reachable content a fatal failure.
