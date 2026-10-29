# Choose a composition, implement it, judge the rendered result

## Depth follows intent and constraints

- **Polish / REFINE:** repair craft and usability inside the current composition. No alternative direction exercise or app-wide rewrite.
- **Recompose:** change grouping, reading order, relative emphasis, component structure and responsive composition where the existing hierarchy fails. A broad “redesign/modernize” request usually calls for this; inspect the actual weaknesses.
- **Reframe:** a complete app redesign may replace the shared shell/navigation presentation and page compositions while preserving destinations and capabilities. Do not remove features, rename routes, migrate frameworks or change branding merely to make the result different.

The user need not know these labels. Infer the depth from their request, state it in the opening brief and honor explicit constraints. “Keep layout” limits structural change; “keep brand” preserves identity but still allows a new composition. Mixed requests can have a narrow exception inside a broader depth. Ask only when a real conflict blocks execution. Do not infer reframe from existing CSS or treat every “improve” as a full redesign.

## Direction before implementation — CREATE and major TRANSFORM only

Compare two or three compact, product-specific concepts in working notes, not separate proposals or prototypes. Each must differ in **what leads, how regions relate, navigation/grouping and phone reading order**, not just colors or fonts. Name the task/content each suits and its downside. Pick one using the actual content, user priorities, brand and available assets; follow an explicit reference instead of inventing competing directions when the user has already chosen one.

Optional: `node <skill-dir>/scripts/design-brief.mjs --product "personal finance for daily spending decisions" --profile finance --depth reframe`. It returns bounded original alternatives and tradeoffs; use `--profile booking` for a service reservation product. Other profiles reuse the existing composition recipes as starting points, not equally researched design systems. The helper does not choose for you, guarantee originality or generate a replacement theme. Reject an option whose data, imagery or interaction order the app cannot support. No mandatory dependency, network lookup or planning file.

Commit the chosen direction in a few lines: main task → dominant region → subordinate context → shared shell → type roles → phone order → content-supported signature. A finance journal should not inherit a spa's service narrative. A theme swap is insufficient when the problem is equal-weight panels or confusing navigation. Preserve strong sections and real content; novelty and diff size are not acceptance criteria.

## Propagate by screen job

For every requested screen/state, keep a compact checklist: its job, current weakness, chosen composition change (or observed reason to preserve it), and rendered review status. Tabs, dialogs, filters and drawers may share a URL. Change shared primitives once, then compose each screen for its own job: overview, collection, detail, form, confirmation. A repeated palette/header is consistency, not evidence that each screen was redesigned. Implement beyond the representative screen; a plan is not completion.

## Critique actual views separately from mechanical checks

Use matching before/after content, theme, scroll and viewports. Open the actual images; use full-size details for weak areas. Where the host offers a fresh-context reviewer and its normal permissions allow it, give the reviewer the task, constraints, chosen direction and captures, without your self-assessment. Otherwise label it self-review. Do not claim independence merely because a second prompt was used in the same context. No image access means visual critique is unverified.

Answer from visible evidence:

| Dimension | Question |
| --- | --- |
| Hierarchy/composition | What attracts attention first? Does the primary task dominate, and has the original grouping problem changed? |
| Product specificity/originality | Which real content or task shapes this layout? Would the same composition fit an unrelated product unchanged? Familiar useful patterns can be appropriate. |
| Navigation/IA | Can a person locate each destination, identify the active screen and reach the primary action? Are secondary choices subordinate without being hidden? |
| Type/consistency | Do headings, numbers, rows and controls have recognizable roles across screens? Does every page use the shared system intentionally? |
| Responsive composition | Does phone order express the same task priorities, with usable navigation and retained context, rather than merely stacking desktop cards? |
| Transformation depth | Did the chosen recompose/reframe actually change the identified structural weakness? A color/type-only pass does not meet a layout acceptance goal. |

Record the **largest remaining visible weakness** as screen/state + viewport + evidence file + specific relationship that fails + a concrete correction. Example: “Activity at 390px: filter controls dominate the first viewport while transactions start below the fold; compact the filter region and put the current period beside the list title.” Avoid “make it premium” or an invented numeric score. Check behavior/accessibility/mechanical defects separately; taste cannot excuse a broken flow.

Implement the correction and recapture affected views, reusing the server/build and unaffected captures. At most two review/correction rounds; stop earlier when goals are met. Report unresolved goals honestly when time/tools run out. Finish with screens changed/preserved/incomplete, evidence actually viewed, functional results and unverified work. A clean mechanical report or different pixels is not proof of a stronger design.
