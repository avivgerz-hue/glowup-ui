# Agent guide for Glowup UI

Glowup UI is an Agent Skill. The canonical product is `skills/glowup-ui/`; one maintained payload serves Claude Code, Codex and other compatible agents. Public preview version: 0.1.0.

- Read `CONTRIBUTING.md` and preserve existing changes.
- Run `npm test` and `node bin/glowup-ui.mjs validate` before and after changes.
- `bin/` and `lib/` implement installation, removal and validation. `tests/` uses node:test.
- Helpers use Node 20+ built-ins. Starter files in `assets/starter/` must end in `.tpl`.
- Keep skill instructions concise. Behavioral changes need real evidence; never fabricate activation, screenshots, quality scores or model metrics.
- `benchmarks/README.md` describes Node 22 browser checks and native paired evaluations. Generated results, logs and private review keys stay outside Git.
- This checkout has a fresh initial history. Do not import another repository's commits, mappings, private reports or backups. Historical benchmark versions are not bundled.
- Preserve routes, APIs, content and behavior when changing existing apps. Do not weaken tests.
- Do not publish, change visibility, tag, merge or push without the owner's authorization.
