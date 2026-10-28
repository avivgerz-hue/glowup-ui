# Public presentation upgrade · review record

28 October 2026. Scope: this clean repository and current public history only. The published v0.1.0 tag/release are unchanged. No retired repository, history, private report, identity mapping or asset was consulted.

## Delivered

Original SVG identity and mobile masthead, a 1280×640 social card, plugin icon, eight genuine application captures, a first-use README, tested installation guidance, evidence-labelled compatibility, contribution forms and a short roadmap. [Research](research/open-source-skill-landscape.md) and [ranked audit](research/upgrade-audit.md) explain the choices.

The focused product fix makes the already-supported preservation scope callable as `composition --mode refine`; `polish` remains compatible. REFINE explicitly follows TRANSFORM's preservation-focused scope. There is no speculative design-rule rewrite, new runtime dependency, telemetry or version bump.

## Executed locally

| Check | Actual result |
|---|---|
| `npm test` / `node scripts/run-tests.mjs` | 136 passed on Linux with Node 20, 22 and 24 |
| `node bin/glowup-ui.mjs validate` | Passed; no warnings |
| `npm run test:browser` in benchmarks | Passed: 11 review assertions, both CREATE kits, 12 interaction journeys, three quality/preservation comparisons |
| Quality fixture tests before/after | Plotline 12/12, helpdesk 14/14, booking 11/11; 96 captures across the comparisons |
| `node benchmarks/showcase.mjs --install`, then `--check` | Passed: 8 captures, 10 checks; 12 tests/build each for TRANSFORM before/after and isolated REFINE, 3 CREATE model tests |
| `node benchmarks/chat-journey.mjs --out …` | 12 existing fixture checks passed; not an agent trial |
| `node benchmarks/refine-safety.mjs` | Passed |
| Reference `agentskills validate` and Claude `plugin validate` | Passed; marketplace installation is optional validator advice, not a tested runtime claim |
| Actual `npm pack`, extract, validate, install/remove | 62 package files; canonical payload matched; all 20 isolated agent/scope lifecycles passed |
| Tagged-source npx and telemetry-disabled standard skills CLI | Both installed the published canonical bytes; own-installer safe removal checked |
| Six dependency lock audits plus `node scripts/starter-lock.mjs` | No reported vulnerabilities; no new dependency added |
| Current-project privacy/link and image checks | No unexpected email/credential-pattern finding or broken local Markdown target; PNGs have no text/EXIF chunks; SVGs have no scripts/external image content |
| `git diff --check` | Passed |

Initial local packaging used an unwritable default npm cache; rerunning with an isolated writable cache passed. A showcase check without an installed Playwright browser failed explicitly; selecting the available Chromium passed. No quality gate, browser sandbox or TLS check was disabled.

Public captures use Chromium 154.0.8037.57, light mode, UTC, en-US, scale 1, 1440×900 and 390×844. Every application capture was visually inspected. PNG/image metadata and size checks run in the root suite; source/image drift is checked by the browser job. GitHub-hosted OS/browser checks are reported by the PR, separately from these local runs.

## Activation and interpretation

The current diagnostic probe could not run Claude Code (CLI unavailable) or initialize native Codex. Remaining provider cases were not run after these blockers. Full instruction delivery and a controlled same-agent A/B advantage remain **unverified**. The CREATE app was implemented in this maintainer-directed Codex session after reading the workflow, TRANSFORM re-renders the bundled pair, and REFINE is scripted. None is a randomized model-quality benchmark. No speedup, blind score or token comparison is claimed.

The original TRANSFORM phone fixture's overflow is preserved and recorded. Changed views must fit. Screenshots are application evidence, not fabricated before/after imagery; [provenance](examples.md) distinguishes every example.

## Self-review from three perspectives

These are three perspectives on the author's own work, not independent human reviews.

- **New developer:** one tagged command, explicit invocation, updates/removal and a troubleshooting table. The published command intentionally stays on v0.1.0; unreleased changes require a reviewed checkout.
- **Designer:** a coherent original identity and contrasting product-specific examples. Desktop and phone images were inspected; the mobile masthead uses larger text. REFINE demonstrates restraint rather than disguising a second redesign.
- **Maintainer:** concise skill, no added dependencies, source-hashed captures, private raw logs excluded, scoped forms, unchanged historical release. About/social settings require owner interaction when integration permissions are absent.

Five most significant weaknesses found in review:

1. **No causal evidence of design superiority — remains open.** Restore normal native startup, prove body loading, then run matched pairs and independent review.
2. **Native platform support is not certified — remains open.** Install/remove and documented paths have evidence; other compatibility states are explicit.
3. **Stable install could be mistaken for unreleased behavior — addressed.** Installation docs separate the immutable release from the reviewed checkout.
4. **A scaled desktop masthead loses legibility on phones — addressed.** An original responsive SVG simplifies the same identity at phone width.
5. **Gallery images could silently become stale — addressed.** CI verifies source/image hashes, matching dimensions, application tests and preservation.

Release recommendation: review the presentation/REFINE-alias PR as a public-preview improvement. It does not justify a proven-quality or general-availability claim. [Owner metadata steps](maintainer-presentation.md) are optional; no merge, tag replacement or publication is performed by this upgrade.
