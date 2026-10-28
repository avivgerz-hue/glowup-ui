# Glowup UI v0.1.1 — Public Preview (prepared, not published)

A small, backward-compatible patch to the public preview. Recommended as **0.1.1**, rather than 0.2.0: the substantive product fix makes the documented REFINE scope callable; the remaining changes improve examples, packaging evidence and onboarding. There is no new design engine, breaking contract or proven model-quality leap. Pre-1.0 versioning does not require exaggerating this scope.

## Changes since v0.1.0

- Accept `composition.mjs --mode refine` as the preservation-focused equivalent of `--mode polish`; existing commands remain valid.
- Explicit REFINE routing through TRANSFORM's polish scope; one maintained canonical skill.
- Original project identity and genuine CREATE/TRANSFORM/REFINE desktop/phone gallery, with source/image hashes and honest provenance.
- Reproducible example checks in CI and matching package/plugin/skill version checks.
- Tested GitHub-source install instructions and a version-pinned, telemetry-disabled standard skills CLI example.
- Compatibility evidence, troubleshooting, issue forms, roadmap and optional privacy-conscious experience reports.

## Requirements and compatibility

Own installer and helpers: Node 20+, Git for GitHub-source npx installation. Standard skills CLI: currently Node 22.20+. Coding agents need their own normal authentication and file/tool permissions. Browser review uses an available browser or optional Playwright, never installed silently. No paid service is required by the skill; agent/model costs are separate.

Ten named agent selections have install/remove tests; these are filesystem/package checks, not ten authenticated runtime certifications. Claude plugin formatting and the Agent Skills specification validate. See [compatibility](../compatibility.md) for exact paths and limitations. No native OpenCode/Claude/Codex activation or controlled quality advantage is newly claimed.

## Demonstrations and limits

The finance CREATE example was maintainer-directed in Codex; TRANSFORM re-renders bundled sources; REFINE uses controlled edits. They are genuine applications, not autonomous A/B results. Native activation, independent design preference, runtime/token efficiency and consistent quality advantage remain unverified. No adoption statistics or speedup claims.

## Installation after publication approval

Until a v0.1.1 tag actually exists, use the [verified v0.1.0 commands](../installation.md) or a reviewed checkout. The following is a **prepared future command, not yet executable or remotely verified**:

```text
npx --yes --package=git+https://github.com/avivgerz-hue/glowup-ui.git#v0.1.1 glowup-ui install --agent codex --scope project
```

For Claude Code use `--agent claude` and `/glowup-ui`; for Codex invoke `$glowup-ui` in a fresh session. Installation alone is not activation proof. Inspect existing customizations before an explicit `install --force`; replacement/removal uses recoverable backups. No npm publication is part of this release plan.

## Prepared assets

- Source-only archive from the approved clean candidate commit, excluding Git history.
- Installable `glowup-ui-0.1.1.tgz` from `npm pack`, not an npm publication.
- SHA-256 checksums and a provenance record tying assets to the exact candidate commit.
- Existing original social card and eight app captures; no unnecessary new demo or fabricated comparison.

Assets remain local until separate release approval. The v0.1.0 tag and release must remain unchanged. Before publishing, revalidate the exact final commit and regenerate assets if it changes. Keep all raw logs and local paths out of public assets.
