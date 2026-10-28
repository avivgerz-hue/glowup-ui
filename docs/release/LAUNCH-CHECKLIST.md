# Approval and launch checklist

Preparation is not publication. No external listing, release (including draft), npm package, tag or visibility change is authorized by this sprint.

## Approvals needed

1. **Approve the preparation PR and v0.1.1 recommendation.** Merge only after exact-head CI is green. Keep public preview status and v0.1.0 untouched.
2. **Separately approve creating tag v0.1.1 and a GitHub pre-release**, from the reviewed final commit, with the source archive, installer tarball and SHA-256 file. No npm package. No visibility change. No reused or moved tags.
3. **Approve each eligible external submission individually**, after its current rules/duplicates/eligibility and genuine runtime evidence are rechecked. [The ranked plan](../distribution/OPPORTUNITIES.md) includes prepared text and blockers. Do not batch-submit to deferred directories.

## Technical sequence after release approval

- Confirm clean source, canonical/package/plugin version agreement, exact-head CI, public-safe authorship, artifact contents and checksums. Rebuild if the approved source differs from the locally tested candidate.
- Create the approved new tag/pre-release; do not edit or retag v0.1.0. Attach only source/package/checksum assets, never private reports, transcripts or Git bundles.
- Verify the public tag resolves to that commit. Execute npx installation from the actual v0.1.1 GitHub tag for Claude/Codex, compare the full installed payload to the approved source, and test safe removal. Do the standard CLI check with telemetry disabled.
- Only after those checks, update the stable README/docs pin from v0.1.0 to v0.1.1 through a small reviewed change and record the actual release date. The existing tag's README remains a historical snapshot; do not move it to update documentation.
- Confirm optional experience/bug forms work from the merged default branch. Self-reports remain self-reports.

## Owner clicks, only where necessary

- About metadata is already populated, verified through the API. No action required. Optional future edits use repository home → **About gear → Description / Topics → Save changes**; [presentation notes](../maintainer-presentation.md) explain the earlier permissions limit.
- Social card: **Settings → General → Social preview → Edit → Upload an image**, choose `assets/brand/social-preview.png`. This is optional branding, not release evidence.
- Awesome Claude Code, later: its **human web form** must be personally completed by the owner, after eligibility and personal review. The agent must not submit or attest on the owner's behalf.

The owner can approve the release work in chat; no terminal commands are required. Optional metadata clicks are not prerequisites for a working install. A blocked directory is not a reason to manufacture stars, change privacy settings, add telemetry or import retired history.
