# Try v0.1.1 independently

Use a disposable copy of a small non-sensitive app and a normally authenticated agent. No subscription to a Glowup service, stars, social post or positive review is required. Your agent may charge for model usage. Stop if normal authentication, network or permissions block execution; do not paste credentials, copy authentication files or disable safeguards.

## 1. Install the published version

In the disposable application's root, with Node 20+ and Git:

```bash
npx --yes --package=git+https://github.com/avivgerz-hue/glowup-ui.git#v0.1.1 glowup-ui install --agent codex --scope project
```

For Claude Code use `--agent claude`; for OpenCode use `--agent opencode`. Different existing installations are preserved by default. Do not use `--force` without reviewing local customizations.

Check the installed SKILL.md and references exist: `.agents/skills/glowup-ui` for Codex/OpenCode; `.claude/skills/glowup-ui` for Claude. Metadata should say 0.1.1. This establishes installation only. Start a fresh trusted agent session in that project.

## 2. Request and inspect loading

Codex: prefix the task below with `$glowup-ui`. Claude Code: use `/glowup-ui`. OpenCode: explicitly request its native `skill` tool to load `glowup-ui`; no universal slash command is assumed.

```text
Refine one settings page in this app. Keep its existing identity and composition.
Before editing, load Glowup UI, read its full SKILL.md and the relevant TRANSFORM
reference, and identify the workflow and preservation constraints you will apply.
Improve only observed weaknesses. Preserve routes, handlers, content and data.
Run the original tests and inspect matching desktop/mobile screenshots if available.
Report what was actually checked and what remains unverified.
```

A listed skill or the agent saying “I used Glowup” is insufficient. Inspect the host's tool transcript privately for successful full-body delivery and relevant reference reads. A denied call, truncated file or failed turn does not confirm loading. Redact transcript details; no raw logs are required for public feedback.

For a more reproducible diagnostic, the repository's [activation procedure](ACTIVATION-DEBUG.md) makes temporary copied fixtures with hidden body/reference markers and a control. Run it only with normally authenticated native CLIs and normal permissions. The production skill has no marker. A fixture diagnostic confirms that loading path, not an implementation-quality advantage or universal automatic selection.

## 3. Check behavior and results

Before editing, note original tests/build results and capture the same page at 1440×900 and 390×844 if possible. Afterward, rerun the same checks with the same data and viewport. Inspect keyboard focus, navigation, save/cancel, validation and phone overflow. Explain which decisions the workflow influenced; include unchanged, worse or broken results honestly. For a useful beginner trial, allow roughly 20–30 minutes, with no obligation to finish.

Optional CREATE trial, in a separate empty folder: create a small event planner with Dashboard/Events/Guests, working search and RSVP validation. Do not mix CREATE and REFINE results into one success count. A substantial TRANSFORM trial can follow once the small trial works.

Do not claim a causal quality advantage from a single result. Fair A/B evaluation needs independent sessions, identical starting source/task/model/effort/budgets and independent assessment; see [paired evaluation](../benchmarks/PAIRED-EVALUATION.md).

## 4. Report only what you verified

Use the optional [experience form](https://github.com/avivgerz-hue/glowup-ui/issues/new?template=experience.yml). It is public and GitHub displays your account. Report version, agent/OS, install method, completed stage, checks and limitations. Text-only or negative feedback is useful. Use fictional data in permitted screenshots; no client names, emails, local paths, private source, credentials or raw transcripts. [Sensitive problems](../SECURITY.md) follow the security policy.

Removal uses the same own-installer source, agent and project scope, replacing `install` with `uninstall`. It moves the skill into recoverable backups. Third-party installers have their own removal rules. Remove or ignore `.glowup-ui/` backups before sharing your disposable app publicly.
