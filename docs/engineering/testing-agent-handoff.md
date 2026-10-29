# Handoff to the independent app-testing agent

> Historical PR #4 record: the fixes are now merged into main and included in the v0.1.2 release target. Original candidate hashes and results below remain unchanged for reproducibility; they are not current publication or native-activation claims. See [release preparation](../release/NOTES-v0.1.2.md).

Test candidate implementation commit **`f1c136b5d7f67c1e2362c0a9090c36dd948630c7`** against unchanged base **`0cdbd06cceaf6444edfe5646dcb3b66ed0204b7d`**. The branch adds documentation after the implementation commit; use the exact implementation hash for reproducibility. This is an unreleased candidate, not the published v0.1.1 payload. Do not use the pinned v0.1.1 installer and assume it contains these fixes.

## Install and prove what loaded

Use separate fresh app copies and agent sessions. From each candidate/base checkout, use its local CLI to install its own canonical payload into the corresponding test project:

```bash
node bin/glowup-ui.mjs install --agent codex --scope project --project /absolute/path/to/test-copy
node bin/glowup-ui.mjs doctor --project /absolute/path/to/test-copy
```

Use `claude` or `opencode` for that host; install only the chosen host's location to avoid duplicates. Start a fresh trusted session. Record the actual model/version, effort, permissions, roots and complete installed-payload hash. Doctor/hash matching proves readable files, not native loading. Follow [activation diagnostics](../ACTIVATION-DEBUG.md), using temporary fixtures only. Separate discovery, explicit request, complete body/reference delivery, actual implementation and quality. If auth/runtime blocks the session, stop retries, return the precise blocker and do not mark activation passed.

## Evaluate these scenarios

Keep task text, app starting files, data, model, effort, tools and execution budget identical between conditions. Do not show one result to another session or manually improve an output. First compare candidate with unchanged base to attribute a candidate effect; a separate no-skill comparison is needed to claim an advantage over the same agent alone. Use existing benchmark infrastructure where appropriate, not newly invented scores.

| Mode | Scenario and acceptance | Watch for |
| --- | --- | --- |
| CREATE | A requested small multi-page product in an empty folder. One brief, a shared first-pass visual system, requested routes/states functional. Capture desktop/phone. Reuse a valid build/server; no mandatory second capture when no fix was needed. | Skipped initial review, missing route coverage, accidentally testing tagged release instead of candidate. |
| TRANSFORM | A full redesign of an existing designed app. Run `inspect.mjs . --scope redesign`. It must report TRANSFORM, not cap work at three edits. Agent should address stated composition/hierarchy weaknesses across requested shared components/routes while preserving behavior/content/brand. | Cosmetic-only work, unauthorized rebranding, shared changes breaking unaffected routes, heuristic findings dismissed without evidence. |
| REFINE | The same quality of existing app with a narrowly scoped polish request. Use `--scope refine`. Preserve shell, typography identity and useful density; fix only evidenced scoped weaknesses. | Scope expansion, unnecessary scaffolding/dependencies or changes to working logic. |
| Discovery | Existing app with installed project skills, recoverable `.glowup-ui` backups and a shared shell imported via a plain-JSON alias to `index.tsx`. Inspection should identify the actual app and shared shell; no backup routes/tokens. | JSONC/extends/workspace aliases are intentionally unresolved; agent must inspect manually rather than treating absent recommendations as absent components. |
| Safety / host setup | Claude configured with `CLAUDE_CONFIG_DIR`; source file symlinks outside the app and a broken source link. Installation should agree with doctor and removal; inspection must neither read linked external source nor crash. | A user install at the configured root alone is not activation evidence. Skipped symlinked UI files must be reported if needed for the task. |

## Evidence to return

- Commit IDs and complete payload hashes for every condition; task text, starting tree and host settings.
- Agent logs demonstrating body/reference delivery and which decisions the workflow influenced. Redact credentials/private user content; diagnostics stay outside production.
- Matching genuine desktop 1440×900 and phone 390×844 captures, same routes/data/theme/state, including changed shared screens. Randomize X/Y for independent human assessment; keep condition key private.
- Original and final build/tests and relevant primary-flow, keyboard, error/empty and navigation checks; distinguish pre-existing failures, regressions and unverified behavior.
- Actual elapsed time, available token usage, tool calls, capture/review iterations and dependency changes. Mark unavailable metrics unavailable.
- Concrete improvements AND regressions, screenshot evidence and reviewer observations. No invented quality scores or attribution based solely on difference counts.

Hypotheses: corrected routing may enable more substantial redesigns; accurate shared-file recommendations may reduce wasted inspection; reused builds/captures may reduce execution cost. None has been established by this engineering sprint. Return a minimal reproduction for negative results before proposing broader instruction changes.
