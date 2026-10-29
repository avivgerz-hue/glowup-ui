# TRANSFORM: redesign the presentation, preserve the product

## Match the request
**REFINE / polish:** fix the requested local weaknesses; keep fonts, palette, composition and shell. `composition.mjs --mode refine` gives the same preservation-focused scope as `--mode polish`.
**Full redesign:** “redesign the app”, “improve the full design”, or “modernize the entire UI” authorizes meaningful composition, typography hierarchy, spacing, surfaces and shared-component changes. Preserve the logo, brand cues, content and behavior. Retain an established font family/palette unless the user requests a new identity; hierarchy, weight, width and layout can still change substantially. A different brand needs explicit intent. When scope is unclear, infer from the requested breadth and state your scope briefly; ask only if blocked.

## Baseline once
From the actual app root:
```
git status --short
node <skill-dir>/scripts/checkpoint.mjs save
node <skill-dir>/scripts/inspect.mjs . --scope redesign
```
Use `--scope refine` instead for polish. The helper describes structure; it cannot infer the user's intended scope from source files.

Checkpoint includes dirty user files, writes once and never restores files. For a new task use a separate `--file .glowup/<task>.json`; never regenerate after editing. Read shell/theme/shared controls, representative routes and original tests in one batch. Run the original build and relevant tests; separate existing failures. Identify every requested screen, including tabs/dialogs sharing a URL; route discovery is only a starting point. Keep a compact screen checklist in working notes, not a separate planning document. Capture their original desktop and phone views with the same data/state planned for after. If capture is unavailable, continue implementation and mark visual quality unverified; never invent a baseline.

## Decide and implement
Choose up to three **priorities**, not three tiny edits. Describe an observed problem and an acceptance condition for each. Example: “Booking selection and summary compete; make selection dominant, group date/time choices, put an accurate summary beside them on desktop and near submission on phone.” This may affect layout, type, controls and multiple pages.

If hierarchy is unclear, use `composition.mjs --product "..." --mode redesign` for a compact recipe. Use existing tokens/components before inventing another system; no generated replacement theme, kit copying or dependency additions. Plan the page's dominant region and subordinate context before tuning borders. Acceptance conditions describe visible outcomes, not edits: “account balance leads, recent activity is scannable, transfer remains reachable on phone,” rather than “add padding and a shadow.”

Proceed from the brief to actual application edits unless the user requested advice only or execution is blocked; a plan or audit is not a transformation. Implement shared shell/control improvements, check one representative page, then complete the remaining requested screens. A shared stylesheet change does not establish screen coverage: inspect each screen's composition and states. A collection, detail and form need related styling but different compositions. Reorganize existing markup when necessary; preserve handlers, values, selectors, accessible names, validation and data flow. Navigation appears once. Keep useful density, images, charts, art, states and existing content. Do not replace functioning logic, migrate frameworks or rewrite unrelated files.

## Verify without erasing the baseline
Run original tests/build and relevant project lint/typecheck. Run `checkpoint.mjs check`; classify every finding. Palette/font/markup matching is heuristic: authorized layout or type changes can need review. Explain the exact finding with original behavior checks and browser evidence. Accidental protected-file, data, wiring, brand or content changes must be corrected; never disable the check to pass.

Use [verification.md](verification.md) for before/after review on every affected route, desktop and phone. Inspect screenshots, not just metrics. Exercise navigation, the primary flow, keyboard and relevant validation/error states. Keep a route unchanged when it is already strong. Compare the visible result with each priority's acceptance condition. If the original hierarchy/composition weakness remains, correct that weakness within the review budget even when tests and measured checks pass; do not invent decorative changes to make images different. Fix new overflow, duplicate chrome, lost context, broken focus or behavior. Recheck changed views after corrections; reuse unaffected captures. At most two review rounds; report unmet priorities and unavailable tools instead of declaring completion.

## Completion
For each requested screen, account for **implemented**, **intentionally preserved** (observed strength/reason), or **blocked/incomplete**, alongside desktop/phone review and primary-flow results. Group screens sharing the same outcome in the final report; do not create a large artifact. An unvisited screen is unverified, not intentionally preserved.

A full redesign needs implemented changes addressing the stated weaknesses, coherent shared components across the requested screens, and preserved behavior checks. A working app with the same unresolved design problems is not a completed redesign. Distinguish implementation status from verification status: unavailable screenshots do not prevent code work, but prevent a verified visual-improvement claim. Report preserved / changed / regressed / unverified, with evidence paths and unmet acceptance conditions. No commit or publication unless requested.
