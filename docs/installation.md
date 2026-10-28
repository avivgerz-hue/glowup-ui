# Install and try Glowup UI

## One command, from your app

Requires Node 20+ and Git. This runs **our installer from the published GitHub v0.1.1 source**, not an unpublished npm package:

```bash
npx --yes --package=git+https://github.com/avivgerz-hue/glowup-ui.git#v0.1.1 glowup-ui install --agent codex --scope project
```

For Claude Code, replace `codex` with `claude`. Omit `--agent` to install both default payloads. For all projects, explicitly choose `--scope user`. Different existing copies are kept unless `--force` is requested; replacements go to recoverable backups. No agent configuration, application dependency or Git ignore file is silently modified.

Start a **new agent session**. In Codex: `$glowup-ui Refine the existing settings page while preserving its identity and behavior.` In Claude Code: `/glowup-ui Refine the existing settings page while preserving its identity and behavior.` Ask the agent to identify the loaded workflow and inspect the result. A successful install is not activation proof.

## Reviewed checkout or downloaded release

```bash
git clone https://github.com/avivgerz-hue/glowup-ui.git
cd glowup-ui
node bin/glowup-ui.mjs validate
node bin/glowup-ui.mjs install --agent codex --scope project --project /absolute/path/to/app
```

This uses current source. The one-command path above pins the published release. Changes listed as unreleased in the changelog are available from a reviewed checkout until the next release. Do not relabel an existing tag to update it.

Remove using the same installer source and agent/scope/project choices, replacing `install` with `uninstall`. Removal moves the recognized payload to a backup, including local customizations. Review backups before discarding them. `--dry-run` writes nothing. Updates use a reviewed new checkout/release and an explicit `install --force` after inspecting differences; no silent update or npm publication is implied.

## Optional standard installer

The third-party [skills CLI](https://github.com/vercel-labs/skills) was tested with this repository's canonical folder. It currently requires Node 22.20+. Example for a POSIX shell, with its telemetry disabled:

```bash
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx skills add https://github.com/avivgerz-hue/glowup-ui/tree/v0.1.1/skills/glowup-ui --skill glowup-ui -a codex --copy
```

The full URL pins the skill payload to v0.1.1; the repository shorthand follows the default branch and can install unreleased changes. The CLI itself is a third-party tool whose version may change.

Follow that tool's own update/removal semantics. Do not layer different installers into the same destination. This option does not establish native activation. Glowup's own installer has no telemetry.

## First-use troubleshooting

| Symptom | Check |
|---|---|
| Agent does not list Glowup | Restart in the correct project. Check its documented skills path and trust/permission settings. |
| Skill listed but no visible influence | Explicitly invoke it and verify body/reference delivery using [activation diagnostics](ACTIVATION-DEBUG.md). Discovery alone is insufficient. |
| Existing-copy conflict | Inspect it first. Use `--force` only to deliberately replace it with a backup. |
| Duplicate versions | Remove the redundant copy with its original installer; plugins/global/project roots can overlap. |
| Browser capture unavailable | Use the host's browser if available or report visual verification as unavailable. Helpers never silently install a browser. |
| Unsupported agent | Use a currently documented custom `--dest` or the file-reading fallback in [compatibility](compatibility.md); do not guess a directory. |

`node bin/glowup-ui.mjs doctor --project /path/to/app` reports files and conflicting copies. It does not prove full loading, runtime behavior or design quality.

## Current published release

The default commands above pin published **v0.1.1**. A checkout of `main` can include later unreleased documentation changes. The earlier [installation audit](release/INSTALLATION-AUDIT.md) records preparation-time v0.1.0 and local candidate checks; the [current adoption evidence](adoption-evidence.md) separately records successful remote v0.1.1 installations. Both v0.1.0 and v0.1.1 tags remain unchanged.
