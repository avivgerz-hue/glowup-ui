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

Use `GLOWUP_BROWSER_EXECUTABLE` for an existing Chromium. Checks cover measurements, two CREATE starter sizes, twelve native journeys and three existing apps: designed Plotline, helpdesk and booking. Before/after functionality and preservation checks must pass. These are scripted fixtures, not autonomous model comparisons or aesthetic scores.

## Agent comparisons

Use [PAIRED-EVALUATION.md](PAIRED-EVALUATION.md) for matched CREATE/TRANSFORM runs and randomized X/Y review. Authentication, explicit full instruction delivery, equal settings and runtime isolation are prerequisites. Reviewers assess screenshots; generated scores start empty. Keep logs, keys and personal data outside Git.

The single-cell Claude harness also supports identical scenario tasks in `scenarios.mjs`:

```bash
node benchmarks/run.mjs --scenario A --condition baseline --dry-run
node benchmarks/run.mjs --scenario A --condition current --dry-run
```

Dry runs prepare independent workspaces and stop before model calls or evaluation. Removing `--dry-run` invokes the normally authenticated Claude CLI with the same configured model, effort, tool allowlist and budget in both conditions. Every condition receives identical current screenshot helpers. No driver reads an old repository commit. Historical versions are not bundled; the optional paired `--previous` flag only accepts a commit that exists in this repository.

Scenarios A/B create finance/store apps. C/D transform helpdesk/booking apps. E refines an already-designed app. Record actual build/test outcomes, changes, available time/tokens/tools and losses. Compare identical seeded screenshots at desktop/mobile sizes. Never equate a fixture pass or prepared workspace with a successful agent run.
