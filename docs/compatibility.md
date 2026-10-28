# Agent compatibility

Glowup UI maintains **one canonical skill**, `skills/glowup-ui/`. Installation copies or links that payload; it does not create agent-specific instruction variants.

**No current-preview agent has verified full activation in an authenticated native session.** A file copy or discovery listing proves neither full instruction loading nor design influence. Use the [activation procedure](ACTIVATION-DEBUG.md) to verify the chosen host; do not treat an installation as current cross-agent certification.

## Tested installation and documented behavior

“Packaging/install tested” means actual copy, payload hash verification and reversible removal in temporary project **and user** directories on Linux. Discovery/activation must still be checked in the host. “Documented format compatibility” means an official source describes the expected layout, without local execution. “Experimental” is reserved for integrations under active trial. “Unverified” means evidence was insufficient; no guessed alias is provided.

Each path below is the **skills parent**: the installer appends `glowup-ui/SKILL.md`. User paths use the operating system's home directory, including Windows.

| Agent / installer selection | Preview status | Selected project / user paths | Invocation and automatic selection | Limitations / official source |
|---|---|---|---|---|
| Claude Code `claude` | Packaging/install tested | `.claude/skills` / `~/.claude/skills` | `/glowup-ui` for standalone copy; plugin names may be namespaced. Description-based automatic selection | Hosted current skills docs blocked here; paths retain historical verification. [Official plugin structure](https://github.com/anthropics/claude-code/blob/main/plugins/README.md), [skills docs](https://code.claude.com/docs/en/skills) |
| OpenAI Codex `codex` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | `$glowup-ui`; implicit selection depends on host configuration | Native CLI currently fails at read-only state initialization; logged-in status is insufficient. [Official roots](https://github.com/openai/codex/blob/main/codex-rs/ext/skills/src/host_roots.rs) |
| OpenCode `opencode` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | Ask to use Glowup; model loads native `skill({name:"glowup-ui"})` tool. No universal `/glowup-ui` claim | Permissions can hide/deny skills; also reads `.opencode` and Claude paths. [Official docs source](https://github.com/anomalyco/opencode/blob/dev/packages/web/src/content/docs/skills.mdx) |
| Gemini CLI `gemini` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | `/skills list` manages discovery; request Glowup by name, model uses `activate_skill` | Workspace trust and activation consent apply; `/skills list` is not activation. [Official docs](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/skills.md) |
| GitHub Copilot `copilot` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | Relevant-request selection; explicit UI/CLI syntax varies by surface | CLI, cloud and IDE have different settings; personal skills are not automatically present in cloud agents. [Official docs](https://github.com/github/docs/blob/main/content/copilot/concepts/customizations/agent-skills.md) |
| VS Code Copilot `vscode` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | Skill slash commands/menu and relevant-request selection, subject to settings | Check the chosen harness; enterprise restrictions may apply. [Official docs](https://github.com/microsoft/vscode-docs/blob/main/docs/agent-customization/agent-skills.md) |
| Pi `pi` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | `/skill:glowup-ui`; automatic selection loads body on demand | Duplicate names use first discovered skill; `/reload` refreshes. [Official docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md) |
| Mistral Vibe `vibe` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | `/glowup-ui` where user invocation is enabled; model selection enabled by default | Project skills require trust; custom paths and disabled patterns affect discovery. [Official README, Skills System](https://github.com/mistralai/mistral-vibe#skills-system) |
| Goose `goose` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | `/skills glowup-ui`; automatic relevant selection | Developer/file tools are needed for bundled helpers. [Official docs](https://github.com/block/goose/blob/main/documentation/docs/guides/context-engineering/using-skills.md) |
| Roo Code `roo` | Packaging/install tested | `.agents/skills` / `~/.agents/skills` | Relevant request triggers body read; no special slash syntax verified here | Mode-specific overrides and duplicate locations can affect loading. [Official docs](https://github.com/RooCodeInc/Roo-Code/blob/main/apps/docs/docs/features/skills.mdx) |
| Google Antigravity | Unverified | Not prescribed | Not verified | [Official docs](https://antigravity.google/docs/skills) inaccessible in this environment |
| Kiro | Unverified | Not prescribed | Not verified | [Official docs](https://kiro.dev/docs/cli/skills/) inaccessible here; no guessed directory |
| Cursor | Unverified | Not prescribed | Not verified | [Official docs](https://cursor.com/docs/context/skills) inaccessible; removed the previous guessed installer mapping |
| Windsurf | Unverified | Not prescribed | Not verified | [Official docs](https://docs.windsurf.com/windsurf/cascade/skills) inaccessible here |
| Cline | Unverified | Not prescribed | Not verified | [Official docs](https://docs.cline.bot/customization/skills) inaccessible here |

Official sources are linked in the table. Documentation establishes expected layouts, not native execution evidence. Install/removal tests do not certify agent activation.

## Install one location per selected agent

```bash
node bin/glowup-ui.mjs install --agent pi --scope project --project /absolute/path/to/app
node bin/glowup-ui.mjs uninstall --agent pi --scope project --project /absolute/path/to/app
```

Replace `pi` with a selection above. Comma-separated agents sharing `.agents/skills` are deduplicated. Default `all` means the shared path **plus Claude's path**, not every product in existence. Both contain the same canonical bytes; if a host reports duplicate names, install only that host's selected location and remove redundant copies through the installer. Do not force replacement of another customized installation without reviewing its backup.

`--scope user` is optional for all projects. Existing changed copies are skipped by default; `--force` moves them to a unique `.glowup-ui/backups/` directory in the selected project or home. Removal also moves payloads out of discovery into recoverable backups. Project backups can contain customized files; keep `.glowup-ui/` out of the application's Git history (this repository ignores it). The installer does not edit your application's `.gitignore`. `--dry-run` writes nothing. `--link` is for development. Windows uses junctions for directory links; CI is configured for Windows, macOS and Linux, but this sprint runs on Linux only.

For an unverified agent, first consult its current official documentation. If a skill parent is confirmed, `--dest /confirmed/skills/parent` copies the same payload there. Otherwise point the agent directly at `skills/glowup-ui/SKILL.md` and ask it to read and follow the file. That is a manual fallback, not native discovery or activation certification.

`doctor --project /path/to/app` inspects default shared/Claude payloads, ancestors and configured legacy roots. It does not inventory every provider plugin cache/custom location. No skill can guarantee automatic host selection. Start a fresh session after installation; verify body/reference delivery with the [diagnostic procedure](ACTIVATION-DEBUG.md) or inspect a real host transcript. Diagnostics remain outside the production payload.
