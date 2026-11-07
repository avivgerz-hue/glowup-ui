# Worked study: choices with a trustworthy summary

**Use when selection and reassurance compete.** Original hand-authored instructional example with the same services, prices, dates and slots; not an agent benchmark. [Source](../../assets/studies/selection-summary.html) · [desktop before](../../assets/studies/selection-before-desktop.png) / [after](../../assets/studies/selection-after-desktop.png) · [phone before](../../assets/studies/selection-before-mobile.png) / [after](../../assets/studies/selection-after-mobile.png).

## Make the decision sequence visible

The weak composition mixes service descriptions, time choices and a large promotional region. The alternative leads with the service decision, gives available times a clear selected state and keeps the accurate selected summary beside the final action. The visual expression comes from duration/price alignment and generous service headings, rather than the dense date/list rhythm of the task-workspace study.

Use this when users need to understand choices before committing. For repeat customers who already know their service, an availability-first layout may be faster. The screenshot is a composition study, not proof that any reservation service or backend exists.

**Scale to the actual choice count.** This three-option example is not an eight-option specification. For many short comparable options, a two-column desktop choice grid can expose names, duration, price and the next step together; use a single column when labels or descriptions need it. Phone choices need readable labels, not compressed desktop columns. Remove redundant introductory space before shrinking controls. Keep current selections and step navigation near the decision, with completed steps visually distinct from the active one. Preserve existing selection/validation behavior.

## Implementation relationships

```css
.reservation { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(16rem, 1fr); gap: 2.5rem; }
.choice { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; }
/* For numerous short choices on desktop, adapt the PARENT, not field labels. */
.many-choices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
.slots { display: grid; grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr)); gap: .5rem; }
.summary { align-self: start; }
@media (max-width: 48rem) {
  .reservation { grid-template-columns: minmax(0, 1fr); }
  .many-choices { grid-template-columns: minmax(0, 1fr); }
  /* Summary follows choices and precedes commitment. No covering bottom bar. */
}
```

Use existing radio inputs or equivalent accessible controls and real validation. Do not replace functioning controls with decorative cards. Persist selection through back navigation and keep price/duration in sync with the actual selection. Sticky summaries must fit the viewport; keep them in normal flow on short or narrow screens.

## Related screens, different jobs

Service list supports comparison; detail explains the offer; selection supports decisions; confirmation foregrounds the actual confirmed details. Shared type, controls and price formatting connect them. A repeated hero does not.

Inspect real selected, unavailable, validation and confirmation states. Check keyboard reachability, longer service labels, reduced motion if used, and whether the phone user can understand their choice without hunting for the summary. Retain all real content. Never invent availability, testimonials, medical claims or imagery to make the layout work.
