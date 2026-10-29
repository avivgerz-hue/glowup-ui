# Adoption evidence · 28 October 2026

A dated maintainer evidence snapshot, not analytics or a user-count dashboard. No private project, credential or retired repository was accessed. Public interest can change; recheck API values before quoting them later.

| Evidence class | Observed evidence | What it establishes / limits |
|---|---|---|
| Verified installations | Release validation executed v0.1.1 GitHub-source installs for Claude Code and Codex, plus the telemetry-disabled standard skills CLI; full canonical bytes matched and REFINE executed. Own-installer removal passed. This sprint also ran the pinned v0.1.1 `--agent opencode --scope project` install and matched all canonical bytes. | Repeated maintainer checks, not three independent users, native agent sessions or global install totals. Standard-CLI removal was not retested. |
| Independent reported usage | No independent usage report available in the public issue snapshot reviewed for this sprint; no independent report has been confirmed by the maintainer here. | Actual usage is unknown. Private users and unreported attempts cannot be counted. Optional reports remain self-reports until evidence is reviewed. |
| GitHub interest | Current repository API: **1 star, 0 forks, 0 subscribers**. | A point-in-time interest signal. Not users, installations, quality, or activation. No identities are collected or attributed here. |
| Confirmed native activation | **0 confirmed in this sprint.** Claude explicit: blocked-auth. Codex explicit: blocked-runtime. Automatic/control cases: not run after provider blockers. | Neither completed a turn. Neither supplied the hidden body/reference markers. No pass, aesthetic result, negative control or automatic-selection conclusion is claimed. |
| Functional examples | Existing source-hashed fixtures and CI verify application behavior, builds and preservation. | Maintainer-directed/scripted evidence, not adoption or a controlled same-agent advantage. |
| Directory/community distribution | Submission and invitation drafts only. No upstream PR, external post, unsolicited message or listing submission. | No acceptance, endorsement or resulting audience is claimed. |

## Distribution update · 29 October 2026

The older table above remains a dated snapshot. Read-only GitHub API checks now confirm [Awesome OpenCode PR #971](https://github.com/awesome-opencode/awesome-opencode/pull/971) is open and unmerged. This establishes a submission, not directory acceptance or adoption. Current public interest remains **1 star and 0 forks**; no new independent-usage or activation evidence was reviewed. Traffic views/clones returned HTTP 403 under this integration, so visitors, clones and conversion rates are unavailable here. The skills.sh website is network-blocked, not verified absent. See the [current growth plan](distribution/GROWTH-PLAN.md) for evidence boundaries and next actions.

## Native activation attempt

Ran `node scripts/test-activation.mjs --run --agents claude,codex --claude-bin <normally available official CLI> --timeout-ms 30000` once with private evidence outside Git. It copies the canonical skill into temporary projects and adds diagnostic markers only there. Production skill bytes remain unchanged. The run's explicit cases were blocked before completion; the harness correctly skipped subsequent cases for those providers. Native OpenCode was not available here and was not tested.

Claude requires normal CLI authentication in the execution environment. Codex must first be able to initialize its normal runtime state under host permissions. Neither blocker authorizes copying auth files, overriding runtime identity, weakening sandbox/TLS, or repeating failed model calls. Use an independently normally authenticated developer session and the [testing guide](INDEPENDENT-TESTING.md); retain raw logs privately. Full body/reference reads and actual implementation are separate stages.

## How to update this report

Use date, release/commit, evidence class, exact check performed, result and limitations. For voluntary public examples, cite a report only with the reporter's permission and avoid personal/contact details. Keep independent testers separate from maintainer runs and repeated reports; count unique consenting reporters only when deduplication is actually supported. No fingerprinting or cross-service identity matching.

No verified design-superiority, broad adoption, speedup, independent quality score or token saving exists in this report. First ten testers is a future target, not an achieved count.
