# Distribution opportunities and prepared text

Original research: 28 October 2026. **Status update, 29 October:** Awesome OpenCode [PR #971](https://github.com/awesome-opencode/awesome-opencode/pull/971) is already open; do not resubmit. Other entries below are preparation records. See the [current discovery review and growth plan](GROWTH-PLAN.md) for rechecked eligibility and blocked website checks. These are ranked opportunities, not endorsements or guaranteed placements. Expected reach below is a qualitative estimate from audience fit and breadth, not measured impressions. Public repository activity is a signal of maintenance, not proof of prompt review. No stars should be bought, traded or manufactured to meet eligibility rules.

Glowup's clean public repository was created on 28 October and had one star when checked. Never use retired history to satisfy age requirements. Recheck eligibility, duplicates, open submissions and rules immediately before any authorized submission.

| Rank | Opportunity | Fit / credibility | Expected audience / effort | Observed activity and readiness |
|---|---|---|---|---|
| 1 | awesome-opencode | High OpenCode fit; public YAML validation and maintainer review | Focused OpenCode audience; low, one YAML file | Last push 3 July 2026. No explicit age/star gate; conditional on relevance review. Verify real native OpenCode use before recommending compatibility. |
| 2 | VoltAgent awesome-agent-skills | High portable-skill fit; explicit link-only curation | Broad coding-agent audience; low, one README line | Last push 28 October. **Defer:** rules require real community adoption; brand-new skills are not accepted. |
| 3 | Awesome Claude Code | High design-category fit; selective human curation | Broad Claude Code audience; low owner effort | Last push 28 October. **Defer:** 14 days plus activity after day one OR 100 stars; human web-form submission only. |
| 4 | heilcheng Agent Skill Index | High Claude/Codex/portable fit; automated eligibility checks | Broad multi-agent audience; low, one README line | Last push 27 October. **Defer:** at least 20 stars and no submission during first 14 days. |
| 5 | Composio Awesome Claude Skills | Relevant development workflow; explicit testing requirements | Broad Claude audience; higher effort and maintenance | Last push 18 September. **Defer:** actual Claude runtime testing remains unverified; submission requires a skill folder, not just a link. Prefer link-only venues first. |

The public project cannot pass the two 14-day gates before 11 November 2026, and age alone does not establish eligibility. Do not solicit artificial engagement. These five are researched candidates; there are **no five immediately eligible, runtime-certified placements** to promise.

## 1. awesome-opencode

[Rules](https://github.com/awesome-opencode/awesome-opencode/blob/main/contributing.md) · [Submission editor](https://github.com/awesome-opencode/awesome-opencode/new/main/data/resources?filename=glowup-ui.yaml)

Create `data/resources/glowup-ui.yaml` in a fork and open a PR. Do not edit the generated README. Required fields: name, repo, tagline (maximum 120 characters), description. The repository must be public, maintained within six months, relevant and not a duplicate. No matching Glowup URL was found in the current README; recheck the YAML directory and open PRs before submitting. Do not label this a native OpenCode plugin.

Prepared YAML:

```yaml
name: Glowup UI
repo: https://github.com/avivgerz-hue/glowup-ui
tagline: Portable UI design workflows for creating, transforming and refining web apps.
description: >-
  MIT-licensed Agent Skill with CREATE, TRANSFORM and REFINE scopes,
  Node helpers, preservation checks and reproducible desktop/mobile examples.
  OpenCode skill-path installation is tested; native activation is not yet verified.
```

Prepared PR title: `docs: add Glowup UI design skill resource`. Explain the documented OpenCode `skill` loading convention, actual install checks, and native runtime limitation. Maintainer acceptance remains discretionary.

## 2. VoltAgent

[Rules](https://github.com/VoltAgent/awesome-agent-skills/blob/main/CONTRIBUTING.md) · [Submission/PR comparison](https://github.com/VoltAgent/awesome-agent-skills/compare)

After real community usage exists, append one line at the end of Community Skills → Development and Testing. Include the owner prefix; description no longer than ten words. Do not copy the payload. Public working skill and documentation are required; brand-new projects are explicitly ineligible.

Prepared title: `Add skill: avivgerz-hue/glowup-ui`

```markdown
- **[avivgerz-hue/glowup-ui](https://github.com/avivgerz-hue/glowup-ui/tree/main/skills/glowup-ui)** - Create, transform and refine interfaces with preservation checks
```

Prepared context: “One canonical MIT-licensed skill with reproducible examples, safe install/removal and tested helpers. Native activation and comparative quality gains remain unverified. Community-use evidence: [add genuine reports only after they exist].” Never submit the placeholder as evidence.

## 3. Awesome Claude Code

[Rules](https://github.com/hesreallyhim/awesome-claude-code/blob/main/CONTRIBUTING.md) · [Required human web form](https://github.com/hesreallyhim/awesome-claude-code/issues/new?template=recommend-resource.yml)

**The owner must personally use the web form. No CLI recommendation, PR, or agent-created issue.** Recommend only one resource at a time. Meet the age/activity OR star condition first. Read its Code of Conduct and personally verify uniqueness and Claude relevance; do not automatically tick attestations. The current source includes a Design & UI/UX category. These notes are a factual reference for the human, not an instruction to circumvent human authorship requirements.

Suggested fields for owner review/rephrasing:

- Name: Glowup UI
- Category: Design & UI/UX
- Link: https://github.com/avivgerz-hue/glowup-ui
- Author alias: avivgerz-hue; author link: https://github.com/avivgerz-hue
- Description: “An MIT-licensed design skill with CREATE, TRANSFORM and REFINE workflows, preservation helpers and reproducible web-app examples. Claude Code installation and plugin packaging are tested; native activation remains unverified.”

Do not describe it as Claude-exclusive, independently benchmarked or runtime-certified. If the form requires a statement that is not true, do not submit.

## 4. heilcheng Agent Skill Index

[Contribution rules](https://github.com/heilcheng/awesome-agent-skills/blob/main/CONTRIBUTING.md) · [Full mandatory submission rules](https://github.com/heilcheng/awesome-agent-skills/blob/main/AGENTS.md) · [Submission/PR comparison](https://github.com/heilcheng/awesome-agent-skills/compare)

Wait for the age and genuine-usage/star gates. Edit only README.md, append one additive line within the best existing Community Skills category, and do not edit translations or create a category. Description under 100 characters, owner prefix and skill-folder link. At most five entries per PR and one open PR per repository. Suggestions as issues are not reviewed. An agent-assisted PR must disclose assistance and author affiliation. Do not ping maintainers for review.

Prepared line:

```markdown
- [avivgerz-hue/glowup-ui](https://github.com/avivgerz-hue/glowup-ui/tree/main/skills/glowup-ui) - UI creation, redesign and refinement with preservation checks
```

Prepared title: `Add avivgerz-hue/glowup-ui to Development and Testing`

Prepared context: “Submitted for the author, with AI assistance. Public MIT-licensed skill with examples and installation tests. Append to the verified Development and Testing category; record freshly verified eligibility facts at submission time. Native activation and design superiority are not certified.”

## 5. Composio

[Rules](https://github.com/ComposioHQ/awesome-claude-skills/blob/master/CONTRIBUTING.md) · [Submission/PR comparison](https://github.com/ComposioHQ/awesome-claude-skills/compare)

Real use case, documented examples, accessible instructions and actual testing on Claude.ai, Claude Code and/or API are required. The current process asks for a lowercase/hyphenated skill folder with SKILL.md and an alphabetically placed README entry in the appropriate category. No new service signup should be implied. Native Claude testing has not passed here; do not assert it has. A vendored folder would need the complete relative resources, MIT attribution and an explicit update strategy, rather than a broken copied SKILL.md. This maintenance cost makes it a later opportunity.

Prepared title: `Add Glowup UI skill`

```markdown
- [Glowup UI](./glowup-ui/) - Create, transform and refine web interfaces while preserving functionality.
```

Prepared description: “A portable design workflow for new web apps and existing frontend redesigns. Includes preservation-focused refinement, Node 20+ helpers and reproducible examples. Requires a normally authenticated coding agent; optional browser checks use an available browser or Playwright. MIT licensed. [Add a completed Claude runtime test only when available.]”

## Investigated but not recommended for submission now

- **skills.sh / Vercel skills:** the official CLI and source discovery rules are verified, and the repository installs through it. The hosted directory remains inaccessible under this environment's network policy. Upstream subsequently confirmed installation-event indexing; see [the verified mechanism and privacy choice](../installation.md#how-skillssh-discovery-works). There is no verified need for a separate submission form or listing guarantee. [Official source](https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md), [telemetry policy](https://github.com/vercel-labs/skills/blob/main/docs/troubleshooting.md#telemetry). Keep `DISABLE_TELEMETRY=1 DO_NOT_TRACK=1`; do not generate synthetic installs or turn telemetry on to inflate rankings. Treat installation support and directory indexing as separate facts.
- **travisvn/awesome-claude-skills:** [rules](https://github.com/travisvn/awesome-claude-skills/blob/main/CONTRIBUTING.md) require ten stars and prohibit explicitly AI-assisted/generated submissions. Last observed push 28 April. Excluded from the actionable shortlist; no tailored submission is prepared and the restriction must not be bypassed by passing off AI text as human work.
- Anthropic/OpenAI first-party skill repositories are not assumed to be open third-party marketing directories. No unverified marketplace or paid placement is recommended just to enlarge this list.

## Shared evidence links

[Repository](https://github.com/avivgerz-hue/glowup-ui) · [Canonical skill](https://github.com/avivgerz-hue/glowup-ui/tree/main/skills/glowup-ui) · [Actual examples](https://github.com/avivgerz-hue/glowup-ui/blob/main/docs/examples.md) · [Compatibility](https://github.com/avivgerz-hue/glowup-ui/blob/main/docs/compatibility.md) · [Evaluation limits](https://github.com/avivgerz-hue/glowup-ui/blob/main/docs/evaluation-status.md) · [MIT license](https://github.com/avivgerz-hue/glowup-ui/blob/main/LICENSE).

Use released tag links after approval for version-specific claims. Use the current compatibility matrix, not a claim that all agents have been authenticated. No listing, external issue, fork, registration, release or package publication was performed in this preparation.
