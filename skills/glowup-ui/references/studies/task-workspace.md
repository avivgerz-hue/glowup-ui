# Worked study: give the work the space

**Use for an observed hierarchy problem**, not every finance/productivity app. Original instructional example, hand-authored with identical data in both versions; not a model comparison. [Source](../../assets/studies/task-workspace.html) · [desktop before](../../assets/studies/task-before-desktop.png) / [after](../../assets/studies/task-after-desktop.png) · [phone before](../../assets/studies/task-before-mobile.png) / [after](../../assets/studies/task-after-mobile.png).

## Same content, different relationships

The source has six scheduled gatherings, attendance, capacity, dates and a next-event summary. The weak composition gives three summaries equal prominence and places the working list below them. The alternative uses a date-led working list as the dominant region, a narrow next-event context rail and a shared, quiet navigation. Event identity, dates and attendance become the graphic material; no decorative chart is added.

This is appropriate when finding and preparing an event is the main task. A monitoring dashboard whose real job is aggregate performance may deserve a dominant summary instead. Identify the actual job before copying the hierarchy.

## Implementation relationships

```css
.workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(15rem, .36fr); gap: 2rem; }
.event-row { display: grid; grid-template-columns: 3.5rem minmax(0, 1fr) auto; align-items: center; }
.event-name { font-size: 1.125rem; font-weight: 650; }
.event-meta { font-size: .875rem; line-height: 1.5; }
@media (max-width: 48rem) {
  .workspace { grid-template-columns: minmax(0, 1fr); }
  /* The working list stays first. Context follows, without removing it. */
  .event-row { grid-template-columns: 2.75rem minmax(0, 1fr); }
  .attendance { grid-column: 2; }
}
```

Keep the app's actual handlers, controls and semantics. A date badge is useful for events; financial rows need aligned signed amounts, project queues may need status/owner. Preserve the relationship, not the example's skin. The code is a structural fragment, not a drop-in component.

## Carry it across screens

- Overview: next actionable work leads; totals provide context.
- Collection: filtering and scan rhythm lead, with less overview decoration.
- Detail: item identity and next action lead; related context supports them.
- Settings: grouped preferences lead; do not repeat the overview composition.

In the actual rendered app, check what fits in the first phone viewport, long item names, empty/filter states, active navigation and the real primary flow. If the collection still appears below unrelated summaries, a palette swap has not implemented this intervention. Compare against the original, identify the largest remaining weakness and use the existing two-round correction budget.
