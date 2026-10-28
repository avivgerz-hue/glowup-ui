# First submission: Awesome OpenCode · review only

Checked 28 October 2026. **Not submitted. No fork or upstream PR created.**

- Upstream: https://github.com/awesome-opencode/awesome-opencode
- Rules: https://github.com/awesome-opencode/awesome-opencode/blob/main/contributing.md
- Schema: https://github.com/awesome-opencode/awesome-opencode/blob/main/data/schema.json
- Submission editor: https://github.com/awesome-opencode/awesome-opencode/new/main/data/resources?filename=glowup-ui.yaml
- Proposed title: `docs: add Glowup UI design skill resource`
- Exact upstream file: **`data/resources/glowup-ui.yaml`**, copied unchanged from [the prepared YAML](submissions/glowup-ui.yaml).

Resources is the category for guides/templates/configuration. A portable skill is not an OpenCode plugin, theme or built-in agent. Do not edit README.md; upstream generates it. Required fields are name, repo, tagline (at most 120 characters) and description; the schema also supports the installation field used here. No guessed minimum OpenCode version or misleading `.opencode` scope metadata is added.

## Proposed PR body

> Adds Glowup UI v0.1.1 as a portable design-skill resource, not a native OpenCode plugin. It provides CREATE, TRANSFORM and preservation-focused REFINE workflows with Node helpers and reproducible examples. The entry pins the GitHub-source installer to v0.1.1, explains `.agents/skills` discovery and explicit native skill-tool loading, and links release/compatibility/removal guidance.
>
> The repository is public, MIT licensed and maintained within six months. The current entry paths and README contain no Glowup duplicate. Native OpenCode activation and a comparative design-quality advantage remain unverified; the entry explicitly states these limits. File installation is not treated as activation.
>
> Prepared for the project author with AI assistance. Only `data/resources/glowup-ui.yaml` is proposed; no generated README change or tracking integration. Please review relevance and wording at your discretion.

## Executed checks

The exact YAML passed upstream `node scripts/validate.js <prepared-file>` using the current upstream validator/schema at commit `bcc5c03cec19789b45ef9af4a969e3fe3fd7431b` (dependencies installed locally with lifecycle scripts disabled). Required fields, URL formats and tagline length passed. Current README/data had no matching Glowup URL or entry filename. A fresh v0.1.1 OpenCode-path project install matched the full canonical payload. Native OpenCode was not executed. These checks are not upstream acceptance.

## Approval gate

Before any authorized submission: recheck rules, open PRs, duplicate URLs and the exact release. Review upstream validation results; this repository's checks do not guarantee upstream acceptance. A genuine native OpenCode run would strengthen the relevance evidence and is still pending. Do not assert that the project has ten users or that maintainers endorsed it. No external submission is authorized by preparing this file.
