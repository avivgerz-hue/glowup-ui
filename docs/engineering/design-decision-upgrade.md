# Design decision candidate

This is a separate experimental candidate based on main `cb804d0`, not PR #8 or PR #10. It keeps CREATE, TRANSFORM and REFINE, existing installer paths, Node 20 helpers and release metadata. The canonical entry point remains a short router. No model-quality or PocketFlow-fix claim is made.

## Adapted principles and implemented scope

Current primary sources studied: [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), [Taste](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md), [Impeccable router](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md) and [critique architecture](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/reference/critique.md). The owner-provided research report was read in the previous stage and retained as recommendations, not proof. Sources are inspected patterns, not invoked skills or instructions adopted wholesale; no competitor corpus, proprietary wording, runtime or scoring system is copied.

- Subject-led direction (Anthropic): ground decisions in the product task/content, keeping brand constraints. Implemented as an original compact decision reference and product-specific alternatives rather than prescribed fonts/palettes.
- Alternatives and rendered correction (Taste): consider distinct compositions before anchoring, but do not import its catalog, imagery quotas, bans or score. Implemented as three finance and three booking alternatives with explicit tradeoffs and rejection conditions; other domains transparently use existing composition guidance as a fallback. The agent may adapt/reject all options.
- Separated critique (Impeccable): judge visible design separately from mechanical findings. Implemented as a screen/state/evidence-based qualitative review and optional fresh-context reviewer, with self-review explicitly identified. No false independence, model judge or universal aesthetic score.

Depth follows user intent: polish retains composition; recompose changes hierarchy/grouping; reframe can change shell/navigation presentation while preserving destinations, data and working flows. Explicit layout constraints win. Major work accounts for every requested screen/state, not just the first page or shared CSS. Both CREATE and major TRANSFORM compare directions unless the user supplied one; local REFINE avoids the extra stage. Up to two evidence-based corrections target the biggest visible weakness, not arbitrary file churn.

## What tests can and cannot establish

Helper tests exercise distinct structural outputs/tradeoffs, product differences, REFINE skipping, invalid options and no writes. Evaluation tests check exact source snapshots, identical apps/tasks, same model/effort/invocation, control absence, payload integrity and tamper rejection. These are tooling/contract tests, not proof the model uses the guidance or makes better designs.

[The design evaluation](../../benchmarks/DESIGN-EVALUATION.md) prepares independent control/current/candidate cells for a mobile finance workspace and a visually different service-booking application. It reuses the existing native runner and blinded screenshot review; no extra dependencies or apps. Native Codex availability was checked normally. Version 0.163.0 starts but cannot initialize its app-server client due to a read-only runtime filesystem. No authenticated turn, task, screenshot comparison, blind rating, token comparison or design win completed. No credentials, trust checks or sandbox were bypassed.

This is suitable for independent testing as a draft; **design-effectiveness remains unproven**. Evaluate false depth escalation (especially REFINE/keep-layout requests), template-like directions, under-transformation, missed states, navigation regressions, cross-page inconsistency and extra execution cost. Retain negative results. Do not merge/release based on helper/unit tests alone.
