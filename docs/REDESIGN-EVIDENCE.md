# Why a passing build is not enough evidence for an AI UI redesign

*Article draft, prepared with AI assistance on behalf of Glowup UI's maintainer. Not submitted to an external publication.*

Ask a coding agent to redesign an existing app and it can fail in two different ways. It can change the product while improving its appearance, or preserve the product while barely changing its design. A successful build detects neither failure reliably.

The useful question is more specific than “does it look modern?” What should lead the screen? Which action must remain reachable on a phone? Which routes, values and interaction outcomes must survive? These questions make a redesign reviewable without forcing every product into the same visual template.

## Preserve an outcome, not a function name

A click handler can remain in the source while changing its result. In Glowup's synthetic regression fixture, the original Save action changed a displayed value from 10 to 11. Changing the handler to produce 12 still passed the static checkpoint. The checkpoint was useful, but it did not establish behavioral preservation.

A narrow browser assertion catches that particular failure: click the original control and require the original visible outcome. Keep the same expectation before and after editing. Rewriting the expectation to match the new result would erase the evidence. Use the application's existing tests first; add a focused check only where an affected flow lacks coverage.

This proves one stated outcome, not the whole product. Reset data between runs and exercise keyboard, validation and navigation where the change touches them. Browser actions can write application data, so use disposable or development data.

## A visible control may be unreachable

A second regression fixture put an overlay over navigation. The navigation still existed in the DOM, and a screenshot file still existed, but a person could not activate the covered control. Bounded hit-testing helped detect the obstruction.

That check also exposed a false assumption: ordinary scrollable content temporarily behind fixed chrome is not necessarily unreachable. A browser journey proved that scrolling could reveal and activate it. The current review retains that case as a finding requiring inspection, while blocked fixed navigation remains a blocker. Measurements need context; hiding the finding or making every overlap fatal would both be mistakes.

## Functional preservation does not establish better design

An interface can pass those checks and remain a weak composition. Compare matching views against a concrete aim: a transaction journal should be scannable; a booking sequence should make selection and confirmation legible; shared navigation should communicate the current destination.

Review every requested screen and relevant state, including dialogs or tabs sharing a URL. A shared stylesheet change does not establish coverage. Open the rendered images, identify the largest remaining weakness and correct its cause within a bounded review budget. If the browser is unavailable, implementation may continue, but visual quality remains unverified.

## Be precise about what the evidence says

Glowup UI packages these workflows and optional helpers as an MIT-licensed Agent Skill. Its repository includes executable regression tests and maintainer-directed examples. Those are engineering evidence, not proof that the skill makes a given agent produce better designs.

The published v0.1.1 preview and current main are different snapshots. The newer outcome-verification and obstruction regression work described here is on main; do not assume the pinned preview includes it. [Source and tests](https://github.com/avivgerz-hue/glowup-ui/blob/main/benchmarks/preservation-browser.mjs) make that boundary inspectable.

To establish design influence, compare independent runs with identical starting code, requirements, model settings and tools. Verify complete skill loading, retain matching before/after views, test the original flows and have someone else assess randomized results. Record ties and regressions. A skill listing, an agent's self-report and different pixels are each weaker evidence than they first appear.

The latest recorded attempt at Glowup's controlled native comparison stopped when the managed Codex runner could not initialize its required state under the available filesystem permissions. No completed comparison is retained. We do not have a design-superiority result to publish. The next useful contribution is an honest, reproducible trial—including a failure—not another unmeasured quality claim.

[Repository and pinned installation](https://github.com/avivgerz-hue/glowup-ui) · [example provenance](https://github.com/avivgerz-hue/glowup-ui/blob/main/docs/examples.md) · [independent testing](https://github.com/avivgerz-hue/glowup-ui/blob/main/docs/INDEPENDENT-TESTING.md)
