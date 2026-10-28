# Glowup UI

A design skill for AI coding agents to create new interfaces and transform existing apps while preserving working functionality.

**v0.1.0 — Public Preview.** One canonical skill, dependency-free Node helpers, CREATE and TRANSFORM workflows. Packaging and functional tests do not prove that an agent produces better designs; authenticated activation and controlled visual comparisons remain unverified.

## Install

With Node.js 20 or newer, from a reviewed checkout:

```bash
git clone https://github.com/avivgerz-hue/glowup-ui.git
cd glowup-ui
node bin/glowup-ui.mjs validate
node bin/glowup-ui.mjs install --agent codex --scope project --project /absolute/path/to/app
node bin/glowup-ui.mjs doctor --project /absolute/path/to/app
```

Use `--agent claude` for Claude Code. Omit `--agent` for both default locations. Restart the agent session. `doctor` checks installed files, not instruction loading. The repository is private during preparation; cloning currently requires account access.

Existing different copies are preserved unless `--force` is requested; replacements are backed up. Omit the project options for user installation. Remove safely with:

```bash
node bin/glowup-ui.mjs uninstall --agent codex --scope project --project /absolute/path/to/app
```

Not published to npm. Do not use `npx glowup-ui` as an installation instruction yet. [Compatibility and paths](docs/compatibility.md).

## Use

Claude Code, CREATE:

```text
/glowup-ui Build an event-planning app with Dashboard, Events and Guests. Include search, RSVP validation and responsive layouts.
```

Codex, TRANSFORM:

```text
$glowup-ui Substantially redesign this app across all pages. Improve composition, navigation, typography and shared components. Preserve routes, APIs, content and functionality. Inspect desktop and mobile before and after.
```

For small changes, request local polish. Both transformation scopes preserve behavior and existing branding unless rebranding is explicitly requested. The optional React/Vite starter supports CREATE; existing apps keep their current stack.

## Verify

```bash
npm test
node bin/glowup-ui.mjs validate
```

[Benchmark guide](benchmarks/README.md) covers real browser checks and independent agent comparisons. Browser helpers need an available browser or optional Playwright; they never silently install one. Optional scaffold installation runs the project's package manager only when requested. Your coding agent has its own authentication and costs.

Installation/removal is tested for Claude Code, Codex, OpenCode, Gemini CLI, GitHub Copilot, VS Code Copilot, Pi, Mistral Vibe, Goose and Roo Code. This is packaging compatibility, not a guarantee of automatic activation. No design-quality scores, speedups or adoption statistics are claimed.

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Release notes](docs/release/NOTES-v0.1.0.md) · [MIT license](LICENSE)
