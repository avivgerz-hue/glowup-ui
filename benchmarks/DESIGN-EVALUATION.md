# Design outcome comparison — current versus candidate

This evaluates design instructions, separately from PR #10's mechanical verification. Nothing here merges PR #8 or #10. Preparation/runner tests are not evidence of better interfaces. Current native Codex 0.163.0 preflight failed before a turn: `failed to initialize in-process app-server client: Read-only file system`. No model/design comparison completed; do not bypass runtime permissions or copy credentials.

## Exact matched inputs

Use full commit hashes, never a working tree, branch name or moving HEAD. The baseline for this proposal is `cb804d03cd5f0bf1073845dd8162eb3ce472745b`; select the exact reviewed candidate commit from its PR. Run from the repository, choosing a new absolute output directory:

```bash
node benchmarks/prepare-design-evaluation.mjs --baseline cb804d03cd5f0bf1073845dd8162eb3ce472745b --candidate FULL_CANDIDATE_COMMIT --out /NEW/design-trial-1
```

It creates six independent workspaces: control/baseline/candidate for **finance** and **booking**. App files always come from the baseline commit, including original tests; only skill payload differs. Fixture READMEs are omitted equally to avoid inheriting the maintainer's design-direction explanation. App files are committed locally with a synthetic fixture identity before skill installation, and skill directories are excluded from fixture Git status. This prevents initially-untracked source from being frozen as user work by checkpoints. No fixture history is pushed. Workspace names are opaque rather than telling the builder which condition it has; temporary extraction payloads are removed after installation. No dependencies/models/browsers are installed or run. Tasks and starting-app hashes must match per product. The existing runner rechecks app/task/payload hashes before execution, rejecting even identical tampering to both recorded app snapshots.

- Finance is the existing dependency-free Margin workspace: overview, activity/filter state, preferences and transaction dialog. It resembles the money-data/mobile-navigation challenge, but is **not PocketFlow**, has three views rather than its four screens and is already designed. A tie/loss is valid evidence. It has model tests and browser-local persistence; reset the same starting storage in each session. `npm start` defaults to port 4188.
- Booking is the plain spa fixture: service detail, time selection, reservation validation and confirmation plus supporting pages. Editorial service hierarchy and reassurance should differ from financial data scanning. Use its locked dependencies, tests/build and preview server. Do not give either agent the other output, current gallery or reviewer feedback.

## Run matched cells with normal host permissions

Audit global/ancestor/plugin skills, host instructions, tools, settings and profiles for all conditions. A clean project alone does not establish isolation. Pin one actually available model, effort and wall-clock budget; use equivalent dependency/browser caches, OS and tools. Replace the uppercase placeholders; the following prepares commands only:

```bash
node benchmarks/run-pair.mjs --manifest /NEW/design-trial-1/manifest.json --kind finance --left baseline --right candidate --agent codex --model EXACT_MODEL --effort high --timeout-ms 600000 --out /NEW/finance-run
node benchmarks/run-pair.mjs --manifest /NEW/design-trial-1/manifest.json --kind booking --left baseline --right candidate --agent codex --model EXACT_MODEL --effort high --timeout-ms 600000 --out /NEW/booking-run
```

Add `--run --isolation-note "actual audit details"` only in a normally authenticated, working host. Both skill arms get the same explicit invocation and task; their canonical payloads differ. For a no-skill comparison select `--left control --right candidate`. Preparation can use `--agent claude` with an appropriate exact model/effort as an alternative; never compare different hosts within one pair. Each pair/output/workspace is single-use: prepare a fresh matrix for every comparison. For repetitions reverse baseline/candidate order on alternate trials to reduce order effects. Aim for at least three independent pairs per product when budget allows, retaining all losses and failures.

The runner records native completion/delivery evidence, real runtime, available tokens/tool events, final app hash and unavailable metrics as null. Review required references in actual transcript results: a name, read request or body-only match is not proof the design reference was delivered or applied. Runner completion is not a valid quality comparison by itself. Stop on auth/runtime failures rather than repeatedly retrying or calling a protocol fixture a model.

## Actual rendered assessment

Run unchanged project tests/build and primary interactions in every output. Record regressions separately from preference. Capture all requested views and relevant filter/dialog/selection/validation states at the same data, theme, scroll and 1440×900 / 390×844 dimensions. Inspect actual PNGs. Finance uses hash-based views and a dialog: route enumeration alone is insufficient. Use the host browser or a stateful project journey to reach the states; do not hide missing-state coverage behind duplicate screenshots. Record dependency additions and verification/correction time when available.

Reuse [paired evaluation and blind review](PAIRED-EVALUATION.md). For each arm create the documented capture result with **actual**, not invented, `seedHash`, browser metadata and screenshot files. The seed hash describes the common initial data/storage, not the redesign's pixels. Preserve this same seed before captures, reload and wait for content/font readiness. `blind-review.mjs` validates matching route/state names, image sizes, seed and browser, randomizes X/Y, and leaves scores null:

```bash
node benchmarks/blind-review.mjs --left /BASELINE/capture/result.json --right /CANDIDATE/capture/result.json --out /NEW/blind-review
```

Keep `.key.json` private until judgments are frozen. Have independent humans judge hierarchy, composition, originality/product fit, navigation clarity, type, cross-screen consistency and responsive order. Record the biggest visible weakness and ties/losses, citing each screen/state/viewport. Separately assess whether ambitious redesign changed the intended structural weaknesses, not simply more pixels. Never infer improvement from diff size, helper text, a passing build or the same implementing agent's score. If independent review is unavailable, mark self-review and leave the independent result pending. A missing browser leaves visual results unverified.

Current status: preparation and integrity tests executed; native model turns, output screenshots, blind judgments, comparative design gains and efficiency gains **unverified**. The present tools prepare and run controlled sessions; they do not automate taste or certify an advantage.
