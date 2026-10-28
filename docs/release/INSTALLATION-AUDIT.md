# Installation audit · 28 October 2026

These checks used isolated temporary projects in Linux. They do not prove native activation. Inherited authentication/proxy/TLS controls were preserved; no agent login was attempted or copied.

## Published v0.1.0 — executed

Both own-installer commands exited zero, delivered every canonical file matching the immutable v0.1.0 tag, passed validation, and were safely removed into recoverable backups:

```bash
npx --yes --package=git+https://github.com/avivgerz-hue/glowup-ui.git#v0.1.0 glowup-ui install --agent codex --scope project
npx --yes --package=git+https://github.com/avivgerz-hue/glowup-ui.git#v0.1.0 glowup-ui install --agent claude --scope project
```

Node 24 was used for these checks; supported minimum is Node 20. Measured install times were 3.62s and 3.72s on this environment, not a speed guarantee or agent-task benchmark. Start a new session and explicitly invoke `$glowup-ui` / `/glowup-ui`; body loading still requires separate evidence.

The following standard CLI command also exited zero and delivered the complete **v0.1.0** payload, not current `main`. Tested using Node 22 and the current skills CLI, with both opt-out variables set:

```bash
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx skills add https://github.com/avivgerz-hue/glowup-ui/tree/v0.1.0/skills/glowup-ui --skill glowup-ui -a codex --copy
```

Its measured install time was 3.62s. Standard-CLI removal was not retested; use that tool's own semantics and do not layer installers. The CLI version can change independently of the skill pin. The previous shorthand `avivgerz-hue/glowup-ui` follows the default branch, so it was replaced in public instructions with the tag URL for reproducibility. The CLI's security-audit requests are also disabled by its documented opt-out variables.

## Local v0.1.1 candidate — executed

`npm pack` created an installable tarball locally; no registry publication occurred. Extraction and validation passed and the full skill matched the candidate canonical source. An actual npx install from that local tarball installed both Claude/Codex copies, reported candidate metadata 0.1.1, executed `composition --mode refine --json` successfully, and passed safe-removal checks. Package, Claude manifest and skill metadata now have a version-consistency test.

This proves the local candidate package. It **does not** prove a remote v0.1.1 installation: that tag does not exist. The future command in the candidate release notes stays explicitly unverified until separate release approval, tag creation and a fresh remote payload check.

## Main, examples and coverage

Published v0.1.0 is the stable pin. `main` contains later REFINE/presentation improvements and can differ while still reporting its original metadata version. The preparation branch sets 0.1.1 as an unreleased candidate. These three sources must not be confused.

Existing working examples are retained; the new showcase check was rerun rather than fabricating new demonstrations. No production design workflow rewrite or dependency addition was needed. Hosted CI on the preparation PR checks the exact candidate and existing browser contracts; final results are recorded in the PR. Native Claude/Codex/OpenCode body loading and matched model-quality comparisons remain unverified. No new token or agent-tool-use metrics are available.
