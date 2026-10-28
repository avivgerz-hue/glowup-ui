# Glowup UI v0.1.1 — Public Preview

A backward-compatible patch to the public preview, correcting REFINE usability and improving examples, installation documentation and packaging evidence.

## Changes since v0.1.0

- Accept `composition.mjs --mode refine` as the preservation-focused equivalent of `--mode polish`; existing commands remain valid.
- Explicit REFINE routing through TRANSFORM's polish scope; one maintained canonical skill.
- Original project identity and genuine CREATE/TRANSFORM/REFINE desktop/phone gallery, with source/image hashes and honest provenance.
- Reproducible example checks in CI and matching package/plugin/skill version checks.
- Tested GitHub-source install instructions and a version-pinned, telemetry-disabled standard skills CLI example.
- Compatibility evidence, troubleshooting, issue forms, roadmap and optional privacy-conscious experience reports.

## Requirements and compatibility

Own installer and helpers: Node 20+, Git for GitHub-source npx installation. Standard skills CLI: currently Node 22.20+. Coding agents need their own normal authentication and file/tool permissions. Browser review uses an available browser or optional Playwright, never installed silently. No paid service is required by the skill; agent/model costs are separate.

Ten named agent selections have install/remove tests; these are filesystem/package checks, not ten authenticated runtime certifications. Claude plugin formatting and the Agent Skills specification validate. See [compatibility](https://github.com/avivgerz-hue/glowup-ui/blob/v0.1.1/docs/compatibility.md) for exact paths and limitations. No native OpenCode/Claude/Codex activation or controlled quality advantage is newly claimed.

## Demonstrations and limits

The finance CREATE example was maintainer-directed in Codex; TRANSFORM re-renders bundled sources; REFINE uses controlled edits. They are genuine applications, not autonomous A/B results. Native activation, independent design preference, runtime/token efficiency and consistent quality advantage remain unverified. No adoption statistics or speedup claims.

## Installation

From your application directory, with Node 20+ and Git:

```bash
npx --yes --package=git+https://github.com/avivgerz-hue/glowup-ui.git#v0.1.1 glowup-ui install --agent codex --scope project
```

For Claude Code use `--agent claude` and `/glowup-ui`; for Codex invoke `$glowup-ui` in a fresh session. Installation alone is not activation proof. Inspect existing customizations before an explicit `install --force`; replacement/removal uses recoverable backups. No npm publication is part of this release plan.

## Source and packaging

Built from main commit `df273c5aa448a61989ba57634a7c754b49fe2355`. GitHub provides source archives for this tag below; the install command uses the tagged GitHub source directly. No npm registry publication occurred. Separate installer/checksum attachments could not be uploaded because the asset-upload endpoint returned Forbidden; they remain local rather than being represented as attached files. The v0.1.0 tag and release remain unchanged.

## Verification

137 repository tests and skill validation passed locally. All 10 required [post-merge CI jobs](https://github.com/avivgerz-hue/glowup-ui/actions/runs/40759483892) passed on the tagged commit, including browser contracts, demo builds, dependency audits, platform tests and specification/plugin validation. Package extraction and full canonical-payload comparison passed.
