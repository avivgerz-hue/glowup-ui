# Evaluation status · 28 October 2026

The repository tests, real browser fixture checks and source-hashed showcase are functional evidence. They do not measure whether Glowup produces better designs than the same agent without it.

A fresh `node scripts/test-activation.mjs --run --timeout-ms 30000` probe was attempted in this environment. Claude's explicit case was blocked because the CLI is unavailable; Codex's explicit case was blocked during native runtime initialization. Remaining cases for each blocked agent were not run. No complete skill-body delivery, native implementation or matched A/B comparison was confirmed. Authentication was not bypassed or copied.

The CREATE example was implemented in this maintainer-directed Codex session after explicitly reading the repository workflow. TRANSFORM re-renders bundled source fixtures; REFINE is a controlled script on the designed fixture. Labels and [capture evidence](../assets/examples/evidence.json) state this. No blind-review score, token count, time saving or design-superiority claim is invented.

The next useful evaluation is normal native startup followed by full-body activation proof, then equal model/effort/task/budget CREATE and TRANSFORM pairs using [the existing runner](../benchmarks/PAIRED-EVALUATION.md). Keep raw transcripts, credentials and review keys private. Independent review must distinguish visual preference, functionality and cost. See [the upgrade review record](UPGRADE-REVIEW.md) for executed functional/package checks and self-review findings.
