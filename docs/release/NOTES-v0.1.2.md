# Glowup UI v0.1.2 — Public Preview

Prepared release notes for a patch to v0.1.1. This preparation does not create a tag or GitHub release. Keep public-preview status; no npm publication is proposed.

## Changes since v0.1.1

- **Request-aligned transformation:** inspection follows full TRANSFORM or scoped REFINE intent. Three priorities are not a three-edit limit. Identity detection no longer decides the task's scope.
- **Safer source inspection:** skip external/broken source symlinks; exclude installed skills and recoverable backups from application discovery and preservation snapshots.
- **Shared-component discovery:** resolve local plain-JSON tsconfig/jsconfig aliases and directory indexes, bounded to the app's physical root. JSONC, inherited/bundler aliases and workspace packages still require manual inspection.
- **Claude custom roots:** user installation/removal respects `CLAUDE_CONFIG_DIR`, consistently with doctor. Project installation remains under the selected project's `.claude/skills`.
- **Actionable diagnostics:** doctor supports help, rejects missing/non-directory project roots, exposes validation/missing-file findings and warns about multiple candidate locations without claiming host precedence. JSON payload inspection remains available.
- **Clearer first use:** selected-host invocation hints, installed paths, fresh-session steps, full-loading evidence, method-specific uninstall guidance and optional privacy-conscious tester reports.
- **Bounded workflow:** extend the opening CREATE brief rather than requiring another plan; reuse builds/servers and recapture affected views after fixes; report actual commit status. Efficiency benefits remain hypotheses.
- **Reproducible distribution guidance:** pin standard skills CLI 1.7.4 and a Git release ref; explain optional genuine-install indexing separately from telemetry-disabled automated checks. Submission material and maintainer examples are not adoption evidence.

No runtime dependencies, frameworks or application implementations were added or changed by this release preparation. The integrated fixes came from merged PRs #4–#6; the full diff from v0.1.1 also includes earlier first-tester, distribution and release-status documentation.

## Engineering verification

On the 0.1.2 candidate, locally:

- **152 repository tests passed**, zero failed/skipped; skill validation and final diff checks passed. Package, Claude plugin and canonical skill versions agree at 0.1.2.
- Extracted `npm pack` payload contains **53 canonical files** matching the reviewed source. Actual CLI install, version inspection, full hash comparison, validation, doctor and recoverable removal passed for Claude/Codex/OpenCode in isolated project and user directories.
- Claude's custom user-root install/doctor/removal passed. A local-tarball `npx` install, installed composition helper and removal passed.
- Standard `skills@1.7.4` installed the **local candidate payload** for Codex with matching full hash; removal and lock cleanup passed. Telemetry remained disabled. This is not a remote v0.1.2-tag test.

Canonical directory hash (`hashDir`'s SHA-256 over sorted relative paths and contents): `c4dfbfd0bde42fc0a8a6190699caeb4ea8d2c9d3c21385efc5f199adbe487083`. This is not an archive checksum.

Exact-head hosted CI must pass on the preparation PR and again on final merged main before tagging: Node 20/22 across Linux/macOS/Windows, dependency audits, Agent Skills/plugin validation, browser contracts and existing example tests/builds. PR check results are the authoritative current CI record; older reports remain dated historical evidence.

## Compatibility and limits

Own installer/helpers require Node 20+; GitHub-source installs require Git. Standard skills CLI 1.7.4 requires Node 22.20+. Browser checks need an available browser or optional Playwright. The skill does not silently install a browser or require a paid service; coding-agent/model authentication and charges are separate.

**Independent authenticated native-agent activation, automatic selection, PocketFlow comparisons, design superiority, time/token savings and broad adoption remain unverified.** Complete file delivery is not proof of execution influence. Source fingerprints and browser fixture checks do not guarantee preservation in arbitrary applications. Existing examples are maintainer-directed/scripted evidence, not controlled agent benchmarks. No new app experiment or screenshot comparison was conducted for this release.

## Installation after publication

The following commands require the approved **v0.1.2 tag**. They have not been executed against that remote tag because it does not yet exist. Before publication, install from an exact reviewed checkout using its local CLI; working public README commands deliberately remain pinned to v0.1.1.

```bash
npx --yes --package=git+https://github.com/avivgerz-hue/glowup-ui.git#v0.1.2 glowup-ui install --agent codex --scope project
```

For Claude Code, use `--agent claude`; invoke `/glowup-ui` in a fresh session. Codex uses `$glowup-ui`. Standard installer alternative, with telemetry disabled:

```bash
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx --yes skills@1.7.4 add 'avivgerz-hue/glowup-ui#v0.1.2' --skill glowup-ui -a codex --copy
```

Use one installer per destination and review existing customizations. Own-installer replacement/removal uses backups; standard-CLI removal deletes its selected installation and manages its own lock. See [installation and activation guidance](../installation.md).

## Owner approval and publication gates

1. Review/merge the focused preparation PR after exact-head checks pass. Verify final merged main passes CI; use that approved commit, not the earlier audit base, as the tag target.
2. Separately authorize a **new v0.1.2 tag and GitHub pre-release** with these notes. Preserve v0.1.0/v0.1.1. No npm package, visibility change, directory submission or announcement is included.
3. After the tag exists, verify remote own-installer and telemetry-disabled standard-CLI installs/removal against the approved canonical payload. Only then refresh public README/installation/test-guide pins and publication status to v0.1.2 through the approved release follow-up. Do not move tags to update documentation.

The absent tag, unexecuted remote round trip and pending owner approvals are publication gates, not failed local installation tests. No engineering blocker is known from completed checks; native-agent/design evidence is still required before making stronger product claims. Do not label unuploaded package/checksum assets as attached; GitHub source archives become available with the tag.
