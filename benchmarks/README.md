# Benchmarks

This fresh repository includes reproducible fixtures and evaluation code, without historical transcripts, scores or Git snapshots. No completed same-agent design-quality advantage is claimed.

## Functional browser checks

Under Node 22:

```bash
cd benchmarks
npm ci
npx playwright install chromium
npm test
npm run test:browser
node chat-journey.mjs --out /absolute/path/to/private-evidence
```

Use `GLOWUP_BROWSER_EXECUTABLE` for an existing Chromium. Checks cover measurements, two CREATE starter sizes, twelve browser interaction journeys and three existing apps: designed Plotline, helpdesk and booking. Before/after functionality and preservation checks must pass. These are scripted fixtures, not autonomous model comparisons or aesthetic scores.

## Public examples

`node benchmarks/showcase.mjs --install` (from the repository root, under Node 22) creates the source-hashed CREATE, TRANSFORM and restrained REFINE gallery. It tests the source apps and matching data, exercises interactions, and captures equal desktop/phone viewports. `--check` checks the examples and committed asset hashes without replacing published images. These are maintainer-directed/scripted demonstrations, not agent comparisons. [Provenance and reproduction](../docs/examples.md).

## Agent comparisons

The v0.2 candidate also provides `capture-design-trial.mjs --kind finance|booking|gather --project APP --out NEW_DIRECTORY --port PORT`. It applies one collector to each implementation: fixed clock/locale/storage, real navigation/dialog/booking outcomes, matching desktop/phone PNGs and mechanical measurements. It never produces aesthetic scores. Booking apps require their original build first. Feed successful matching result files to `blind-review.mjs`; retain the key outside reviewer materials. Fresh-context in-session model trials are a separate runner from the native CLI comparisons below and do not establish native compatibility or fully pinned provider settings.

`node benchmarks/gather-showcase.mjs --check` verifies the source-hashed four-screen sequential demonstration. It is not a matched skill advantage; see [its provenance](../demo/gather/README.md).

Use [PAIRED-EVALUATION.md](PAIRED-EVALUATION.md) for matched CREATE/TRANSFORM runs and randomized X/Y review. Authentication, explicit full instruction delivery, equal settings and runtime isolation are prerequisites. Reviewers assess screenshots; generated scores start empty. Keep logs, keys and personal data outside Git.

The single-cell Claude harness also supports identical scenario tasks in `scenarios.mjs`:

```bash
node benchmarks/run.mjs --scenario A --condition baseline --dry-run
node benchmarks/run.mjs --scenario A --condition current --dry-run
```

Dry runs prepare independent workspaces and stop before model calls or evaluation. Removing `--dry-run` invokes the normally authenticated Claude CLI with the same configured model, effort, tool allowlist and budget in both conditions. Every condition receives identical current screenshot helpers. No driver reads an old repository commit. Historical versions are not bundled; the optional paired `--previous` flag only accepts a commit that exists in this repository.

The paired runner stops on provider authentication, network, runtime and usage-quota blockers. A `blocked-quota` result is not a design failure and leaves the other condition unrun. Preserve interrupted files/logs privately; retry only after the reported prerequisite changes, and distinguish a resumed session from an uninterrupted equal-budget trial. Do not count passing fixture tests as a completed agent comparison.

Scenarios A/B create finance/store apps. C/D transform helpdesk/booking apps. E refines an already-designed app. Record actual build/test outcomes, changes, available time/tokens/tools and losses. Compare identical seeded screenshots at desktop/mobile sizes. Never equate a fixture pass or prepared workspace with a successful agent run.
