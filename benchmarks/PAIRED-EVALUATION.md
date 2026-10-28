# Paired evaluation

Prepare independent native agent runs with identical tasks, model settings, permissions and budgets. No current-preview quality advantage is established.

## 1. Authenticate and prove loading

Native startup and normal authentication must work before evaluation. Login status alone does not establish usable model access.

Use your normal authenticated CLI profile. Do not copy credentials into this repository. On a usable local machine run `claude` and `/login`, or `codex login`, then:

```bash
node scripts/test-activation.mjs --run --timeout-ms 60000
```

A successful explicit diagnostic requires hidden body and reference tokens in the final response. First auth/network/runtime failure skips remaining cases for that agent. Controls only check diagnostic leakage; they cannot prove the absence of globally installed skills. Production instructions contain no diagnostic markers.

## 2. Prepare independent workspaces

```bash
node benchmarks/activation/prepare-comparison.mjs
```

The printed directory contains identical CREATE tasks and identical TRANSFORM (named `refine`) booking fixtures. Each invocation creates fresh folders. `--previous COMMIT` also prepares a historical payload for manual comparison; the runner currently selects current/control pairs only.

Audit **both** agent profiles for global, plugin and ancestor skills, project instructions, tools and model settings. Use identical clean profiles with normal authentication; exclude only Glowup from the control. Do not use safe mode only in the control. The runner checks project payloads and hashes, but cannot prove runtime isolation. Record the audit and inspect logs for contamination afterward.

Install fixture dependencies identically before TRANSFORM. Run original tests/build in both workspaces and retain their logs. Choose an exact available model ID and supported effort level. Replace the uppercase placeholders below:

```bash
node benchmarks/run-pair.mjs --manifest /PATH/manifest.json --kind create --agent codex --model MODEL_ID --effort high
node benchmarks/run-pair.mjs --manifest /PATH/manifest.json --kind refine --agent claude --model MODEL_ID --effort high
```

These only prepare commands. To execute, add `--run --isolation-note "How profiles, global skills, ancestors and tools were checked"`. `--bin /path/to/cli` selects a normally configured executable; never bypass permissions. `--timeout-ms 600000` supplies the same wall-clock cap to both cells. Native permissions remain active; a permission denial is an incomplete trial, not a benchmark failure of the design skill. Each output directory must be new. Failed/incomplete first cells stop the pair. Only native error events or stderr can trigger provider-failure classification; login messages in application content cannot. A successful terminal event allows cleanup of lingering background processes after a short grace period, recorded separately from a timeout. Repeat preparation for three independent trials; do not reuse edited workspaces. Model effort names are provider-specific. Both conditions within a pair always use the same value.

Logs, commands, CLI version, task/application/skill hashes, runtime and available native usage stay in the printed output directory. Inspect these for private information before sharing. Codex counts completed command/file/MCP/search events; Claude counts tool-use events; do not compare these counts across providers. No missing tokens, costs or iterations are estimated. `runs-completed-review-required` is **not** a pass. `isolationVerified` remains false until an independent audit; delivery evidence is not design influence.

## 3. Verify and capture

Run the original test/build commands after both runs. Inspect source changes to ensure tests, routes, data/API contracts and key flows survived. Record dependencies added, failures and unavailable checks. Use the installed screenshot helper or your browser with exactly the same browser/version, viewport, sample data, theme, font readiness and scroll position. Reload after storage seeding. Capture desktop 1440×900 and mobile 390×844 across all requested pages; inspect actual images. Record a specific link from instruction → agent decision → implementation when claiming influence.

For the existing chat fixture or compatible chat app:

```bash
GLOWUP_BROWSER_EXECUTABLE=/usr/bin/chromium node benchmarks/chat-journey.mjs --url http://127.0.0.1:4179 --out /NEW/capture
```

Omitting `--url` checks the original fixture only. This test exercises 12 functional checks and captures six views from a fixed, reloaded state. It is **not** an agent run. The seeded app state is defined in `lib/chat-state.mjs` and selectors in `chat-journey.mjs`; do not impose this contract on unrelated products.

## 4. Independent visual review

```bash
node benchmarks/blind-review.mjs --left /A/capture/result.json --right /B/capture/result.json --out /NEW/review
```

Input is a capture result containing `pass`, `seedHash`, identical `browser` settings and `screenshots: [{file,route,width,height}]`; all PNGs must exist inside their result directory. The tool rejects mismatched state/browser/routes/dimensions and checks PNG dimensions. For other app capture tools, record these fields from the actual browser setup, never invent them to make inputs pass.

Give reviewers **only the review directory**. Keep the sibling `.key.json` private until scores/rationales are frozen. X/Y mapping is randomized and consistent across pages. Scores start null; the generator never evaluates aesthetics. Judge hierarchy, type, composition, originality, product fit, consistency, responsiveness and polish; run functionality/accessibility checks separately. Distinctive visuals may still reveal a condition, so this is label blinding, not guaranteed assessor ignorance. Retain every trial, loss and tie. Compare paired differences and costs; three trials are preliminary evidence, not a broad guarantee.
