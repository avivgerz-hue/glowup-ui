# Verify outcomes, not handler names

Use existing project behavior tests first. Static checkpoints detect some removed code/content; a retained handler can still do something different. For an affected primary flow lacking a suitable test, use the host's browser tools or the optional `scripts/verify-flow.mjs`. Do not run every flow for local polish. Shared controls/navigation need representative affected flows; full transformations need the requested screens and primary flows. A passing flow covers only its stated outcomes.

Before editing, identify a working outcome from the actual app and user requirements. Save a short **local, temporary** JSON flow, run it on the original, then reuse the same file on the candidate. Do not regenerate expectations to match a regression. Separate pre-existing failures and missing browser access from preservation evidence. No new permanent app configuration is required.

Example for a fixture where Save changes a displayed balance from 10 to 11 (adapt selectors and expectations to the actual product, never impose these on an unrelated app):

```json
{"steps":[{"click":"#save"},{"expectText":{"selector":"#balance","text":"11"}}]}
```

```bash
node <skill-dir>/scripts/verify-flow.mjs --flow /path/to/local-flow.json --base-url http://localhost:4173 --path /settings
```

Defaults: 390×844 viewport, 3-second timeout per step. Use `--viewport 1440x900` for desktop, `--timeout 5000` if the real app needs it. `--out /existing/private/evidence.json` writes a new result only; it refuses to overwrite evidence. The helper does not start a server, install dependencies, load saved authentication or execute JavaScript from the JSON. Browser prerequisites and `GLOWUP_BROWSER_EXECUTABLE` are the same as screenshot capture. Use a normal dev login through existing tools for authenticated apps; do not weaken auth or sandbox settings.

Actions: `click` takes a CSS selector; `fill` takes `{selector,value}`; `expectText` takes `{selector,text}` and requires one visible element's trimmed rendered text to match exactly; `expectURL` takes a path including query/hash, such as `/activity?month=2`. Finish with an outcome assertion. Prefer stable labels/test IDs exposed by the app; the helper's selectors are CSS. Up to 100 steps, no arbitrary eval or imported project code. Console errors and uncaught page errors during navigation/steps fail the flow; inspect them locally, do not suppress them to pass.

Exit 0 means the stated assertions passed, 1 means a flow/error check failed, 64 means setup/specification failed. Missing optional browser support is **unverified**, not preserved. Results contain action indexes/statuses, assertion and error counts, and a hash of the exact parsed contract. They omit raw console messages, selector/expected text and fill values; the source contract and screenshots can still contain private information. Keep them outside public Git and sanitize anything shared.

Rendered review now samples five points within the viewport-visible portion of each enabled control/non-inline link, up to 200 candidates. All intercepted samples produce `obscured-controls`; inspect the indicated screen for overlay/nav problems. Associated labels, descendants and intentional modal background blocking are accounted for. This does not prove full-page visibility, keyboard access, drag behavior or accessibility: offscreen controls are skipped, partial obstruction can escape sampling, and complex popovers/iframes need direct review. Older manifests without occlusion measurements have no evidence for this check. No mechanical result establishes visual quality.
