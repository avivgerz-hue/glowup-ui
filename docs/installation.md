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

The third-party [skills CLI](https://github.com/vercel-labs/skills) requires **Node 22.20+** and Git. Run from the application's root. This POSIX-shell command pins both CLI **1.7.4** and Glowup **v0.1.1**, disables telemetry/security-audit requests, and uses project scope:

```bash
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx --yes skills@1.7.4 add 'avivgerz-hue/glowup-ui#v0.1.1' --skill glowup-ui -a codex --copy
```

`#v0.1.1` selects the Git ref; `--skill glowup-ui` selects the canonical skill. The unpinned shorthand `avivgerz-hue/glowup-ui` follows the default branch, so it can install unreleased changes. `--copy` avoids symlink installation. Project scope is the default; omit `-g` to avoid user-wide installation. For Claude Code, the standard CLI's agent name is `claude-code` (our installer's name is `claude`); OpenCode uses `opencode`. See the [upstream command reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md) and [compatibility limits](compatibility.md).

Inspect and remove a project installation with the same tool:

```bash
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx --yes skills@1.7.4 list -a codex
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 npx --yes skills@1.7.4 remove glowup-ui -a codex
```

Review existing copies before installing: the standard CLI can overwrite destinations, and its removal deletes the selected installation rather than using Glowup's recoverable backups. Do not layer installers or assume a same-name skill is a separate version. Codex and OpenCode share the project `.agents/skills` location, so removing that payload can affect both. Keep local customizations separately before changing installer or source. Avoid unreviewed `skills update` when retaining an exact release; deliberately reinstall a reviewed ref instead.

**Verified 29 October 2026:** one actual standard-CLI 1.7.4 install/removal cycle for Codex in a disposable Linux project, with an isolated user directory/cache and telemetry disabled. All **53 canonical payload files** matched the GitHub v0.1.1 archive byte-for-byte; an installed composition helper executed; project listing reflected installation/removal; the removed payload and lock entry were absent afterward. Unrelated files and another skill remained unchanged; no user-wide installation was created. Standard-CLI installation/removal for other hosts/platforms and native agent activation were not tested in this check. These are maintainer infrastructure checks, not independent usage or design-quality evidence.

### How skills.sh discovery works

The CLI discovers `skills/glowup-ui/SKILL.md` directly in GitHub; no new discovery manifest is needed. Website indexing is separate. The [closing response in upstream issue #2367](https://github.com/vercel-labs/skills/issues/2367#issuecomment-6029866319) states that genuine installations with telemetry enabled normally trigger indexing and that no manual reindex request is needed. Discovery-only checks and the telemetry-disabled commands above do not send that installation event.

For an intended real use of Glowup, an owner may choose to run the same pinned install **once**, without the `DISABLE_TELEMETRY` / `DO_NOT_TRACK` opt-outs set for that process. The third-party CLI then sends its normal public-source installation event and may request a security audit; Glowup itself has no telemetry. This is optional, requires an informed privacy choice, and is not a guarantee of indexing or a native activation test. Do not replay telemetry, repeat installs to raise counts, or assume a propagation deadline. If the listing remains absent after a genuine install, inspect the actual result before considering any further action. Automated validation keeps both opt-outs enabled.

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
