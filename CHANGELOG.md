# Changelog

## Unreleased

Engineering hardening and one new capability. No design-quality or activation claim is changed by any of it.

- **Real accessibility audit.** `screenshot.mjs --a11y` runs 17 DOM rules (alt text and failed images, control and field names, ARIA roles and required attributes, `aria-hidden` containing focusable content, duplicate ids, heading order and a missing page heading, landmarks, `lang`/title, keyboard-reachable scroll regions, button type, 24px target size, missing focus styling). Every rule has a test that asserts it fires on a defect and stays quiet on correct markup. Critical/serious violations become blockers in `review.mjs`. Scoped as DOM-only evidence: no screen reader, keyboard trap, focus movement or contrast-over-imagery proof.
- **Preservation checks see relocations.** Moving a handler or copy between existing files previously kept the aggregate count and passed silently. It is now reported as `moved (review)`; extraction into a new component stays a pass as `extracted (ok)` because nothing can be lost.
- **Inspection survives unreadable paths.** An EACCES directory in `look.mjs` aborted orientation for the whole app, including `direction`/`inspect`/`checkpoint`. It now skips the path, reports it, and marks the fingerprint partial.
- **Composition stops degrading on surface words.** `dashboard` lived in productivity's term list, so `personal finance dashboard` tied and fell back to the generic recipe. Surface words now break ties instead of creating them; two genuinely different domains still fall back.
- **Scaffold usage handling.** `--help`/`-h` print usage instead of a raw `parseArgs` stack; a new project without `--product` is refused (exit 64) instead of silently generating a generic template.
- **Benchmark settings are configurable and recorded.** `BENCH_MODEL`, `BENCH_EFFORT`, `BENCH_BUDGET_USD` and `BENCH_TIMEOUT_MS` override the pins; invalid values are rejected; `meta.json` records each setting and whether it came from the default or an override.
- OpenAI manifest `brand_color` corrected from `#7C3AED` (used nowhere else) to the actual brand green `#143C33`.

Suite: 158 → 168 tests, all passing; `validate` still clean; `SKILL.md` remains 32 body lines.

## v0.1.2 — Public Preview (release preparation)

Prepared patch release; no tag or publication is performed by this PR. Public installation pins stay on v0.1.1 until v0.1.2 is published and remotely verified.

- Align inspection with requested TRANSFORM/REFINE scope; priorities are not an edit ceiling.
- Honor Claude's configured user root consistently across installation, doctor and removal.
- Skip external/broken source symlinks and exclude installed skill/backups from application inspection and preservation checks.
- Resolve bounded plain-JSON shared-component aliases and directory indexes, documenting unsupported configurations.
- Improve doctor help, project-root validation, text diagnostics and duplicate-location guidance without asserting native activation or host precedence.
- Show relevant post-install invocation hints; clarify paths, fresh sessions, full-loading evidence and method-specific removal.
- Reuse CREATE builds/servers and scoped recaptures; report actual commit status.
- Document a pinned standard skills CLI and release ref, verified install/removal, and optional genuine-install indexing; keep automated telemetry disabled.
- Improve voluntary tester feedback and preserve accurate installation/adoption evidence. Prepare directory submission material without implying acceptance or usage.

These are engineering fixes and documentation changes, not evidence of superior agent-produced designs or lower execution cost. See [v0.1.2 notes](docs/release/NOTES-v0.1.2.md).

## v0.1.1 — Public Preview · 2026-10-28

- Original project identity, real source-hashed examples and an example-led README.
- Tested one-command GitHub-source installation and optional standard-installer guidance.
- Explicit REFINE naming and a preservation-focused `composition --mode refine` alias; existing polish usage remains supported.
- Reproducible showcase checks, clearer compatibility/evidence states and contribution forms.
- Opt-in public experience reports and a version-pinned standard-installer example.
- Release preparation and rule-checked directory submission drafts; no listings submitted.

Published as a backward-compatible public-preview patch. [v0.1.1 release](https://github.com/avivgerz-hue/glowup-ui/releases/tag/v0.1.1). The v0.1.0 tag/release remain unchanged.

## v0.1.0 — Public Preview · 2026-10-28

[Published release](https://github.com/avivgerz-hue/glowup-ui/releases/tag/v0.1.0). First public preview of the portable skill, safe installer and Node helpers, preservation/browser tooling and audited starter dependency locks. Native agent activation and comparative design-quality advantage were not established by this release.
