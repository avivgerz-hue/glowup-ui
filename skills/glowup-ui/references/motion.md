# Purposeful UI motion

Implement UI animation in the application. A request for animation does not imply an AI-generated video: use the app's own CSS, SVG, Web Animations API, canvas, or an already-installed motion library as appropriate. Use video only when the user specifically needs video footage/content or asks for a video deliverable. Inspect the existing stack and motion conventions first; avoid adding a dependency for a small effect.

## Choose motion for a job

- Identify the screen, state, trigger and user outcome before choosing an effect. Useful jobs include showing cause and effect, acknowledging an action, clarifying hierarchy, or orienting someone after a navigation/state change.
- State the motion contract briefly: **trigger → what changes → settled state → reduced-motion alternative**. Prefer the smallest movement that makes the change easier to understand.
- Use restrained transitions for controls and state feedback; reserve longer motion for a meaningful reveal or scene change. Treat duration examples in the existing product as the source of truth. Avoid animating every element, gratuitous parallax, perpetual decorative loops, or movement that delays a click, focus change, or result.
- Prefer `transform` and `opacity` for movement; animate layout, large filters, or continuously changing canvas only when the visual result requires it. Keep the final state correct if animation is interrupted, skipped, or the component unmounts.

## Implement accessibly in the existing app

- Prefer CSS transitions/keyframes for simple effects, SVG for vector artwork, and the Web Animations API or an already-installed library for sequenced or interruptible motion. Use canvas for genuinely continuous/custom scenes, not ordinary control feedback. Follow existing project patterns and do not add a new library unless the task needs it.
- Respect `prefers-reduced-motion` in CSS and any JavaScript-driven motion. Reduce or remove nonessential movement, especially large pans, zooms, parallax and spatial transitions; retain the same information, state feedback and usable controls without motion. Do not rely on animation alone to communicate success, error, selection, or availability.
- Keep text and controls available to assistive technology throughout. Do not hide important content until an animation finishes, move keyboard focus to create an effect, or let motion block input. Avoid flashing effects and respect existing focus, keyboard, and touch behavior.
- Ensure loops that are necessary can be paused or stopped, and that motion does not continue solely as decoration when it distracts from the task.

## Verify the motion itself

- In a live browser or a project test harness, exercise the real trigger and inspect the start, transition and settled states with normal motion preferences. Check interruption, repeat activation, navigation away, and affected loading/empty/error states when those behaviors apply to the chosen animation.
- Repeat with reduced motion enabled. Confirm that the state and information remain understandable, the experience is not disorienting, and the primary interaction still completes. Include a phone-sized view when the motion changes layout or viewport composition.
- The repository screenshot helper is for static visual review: it requests reduced motion and disables animations at capture. Its screenshots can check the resulting layout, but cannot prove that motion plays, feels coherent, or works under normal preferences. If live motion checks are unavailable, say so explicitly; do not claim animation was tested from a still image.
