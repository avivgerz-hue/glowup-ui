# TRANSFORM: redesign the presentation, preserve the product

## Match the request
**REFINE / polish:** fix the requested local weaknesses; keep fonts, palette, composition and shell. `composition.mjs --mode refine` gives the same preservation-focused scope as `--mode polish`.
**Full redesign:** “redesign the app”, “improve the full design”, or “modernize the entire UI” authorizes meaningful composition, typography hierarchy, spacing, surfaces and shared-component changes. Preserve the logo, brand cues, content and behavior. Retain an established font family/palette unless the user requests a new identity; hierarchy, weight, width and layout can still change substantially. A different brand needs explicit intent. When scope is unclear, infer from the requested breadth and state your scope briefly; ask only if blocked.

## Baseline once
From the actual app root:
```
git status --short
node <skill-dir>/scripts/checkpoint.mjs save
node <skill-dir>/scripts/inspect.mjs .
```
Checkpoint includes dirty user files, writes once and never restores files. For a new task use a separate `--file .glowup/<task>.json`; never regenerate after editing. Read shell/theme/shared controls, representative routes and original tests in one batch. Run the original build and relevant tests; separate existing failures. Capture original affected routes at desktop and phone with the same data/state planned for after.

## Decide and implement
Choose up to three **priorities**, not three tiny edits. Describe an observed problem and an acceptance condition for each. Example: “Booking selection and summary compete; make selection dominant, group date/time choices, put an accurate summary beside them on desktop and near submission on phone.” This may affect layout, type, controls and multiple pages.

If hierarchy is unclear, use `composition.mjs --product "..." --mode redesign` for a compact recipe. Use existing tokens/components before inventing another system; no generated replacement theme, kit copying or dependency additions. Plan the page's dominant region and subordinate context before tuning borders.

Implement shared shell/control improvements, check one representative page, then spread the working treatment across affected routes. A collection, detail and form need related styling but different compositions. Reorganize existing markup when necessary; preserve handlers, values, selectors, accessible names, validation and data flow. Navigation appears once. Keep useful density, images, charts, art, states and existing content. Do not replace functioning logic, migrate frameworks or rewrite unrelated files.

## Verify without erasing the baseline
Run original tests/build and relevant project lint/typecheck. Run `checkpoint.mjs check`; classify every finding. Palette/font/markup matching is heuristic: authorized layout or type changes can need review. Explain the exact finding with original behavior checks and browser evidence. Accidental protected-file, data, wiring, brand or content changes must be corrected; never disable the check to pass.

Use [verification.md](verification.md) for before/after review on every affected route, desktop and phone. Inspect screenshots, not just metrics. Exercise navigation, the primary flow, keyboard and relevant validation/error states. Keep a route unchanged when it is already strong. Fix new overflow, duplicate chrome, lost context, broken focus or behavior. At most two review rounds; report unresolved issues and unavailable tools.

Finish with what visibly changed, why the main task is clearer, checks actually run and limits. No claim of improvement without a real view; no commit or publication unless requested.
