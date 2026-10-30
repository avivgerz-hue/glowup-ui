# Verification and report

Bounded, honest checks. Run each once, fix what is wrong, confirm once. Never claim a check you did not run; use: passed, failed (pre-existing), failed (fixed), failed (open), not available, not run (reason).

## Code
- Use the project's own scripts via its package manager (lockfile decides): `build`, `test`, `lint`, `typecheck`/`tsc` when they exist. In TRANSFORM, establish build and relevant test results before editing; compare the same checks after each coherent batch and once after fixes. Distinguish pre-existing failures. Do not run a full suite repeatedly when no relevant changes occurred.
- `node <skill-dir>/scripts/lint.mjs src`: static accessibility and craft checks (an `aria-label` that does not contain the visible text, icon-only controls with no name, images without alt, scroll regions that keyboards cannot reach, removed focus outlines, Tailwind classes built with template strings). Fix every error; weigh the warnings.
- Fix failures you caused. Report pre-existing failures; do not fix unrelated code.
- TRANSFORM: `node <skill-dir>/scripts/checkpoint.mjs check` compares with the actual starting state, including uncommitted work. Review every failure/warning; run original behavior tests. `audit.mjs --base <ref>` is an additional Git audit when useful, not a replacement for the checkpoint.

For preservation-sensitive changes, verify actual outcomes using existing tests or [focused behavior assertions](behavior-checks.md). Keep the same pre-edit expectations for before/after; a static checkpoint pass alone does not prove behavior. Rendered hit-testing can flag obscured navigation/controls, but inspect the actual screenshots and exercise the flow independently of aesthetic critique.

## Screenshots (when a browser exists)
1. `node <skill-dir>/scripts/screenshot.mjs --check`. For an existing system Chromium, set `GLOWUP_BROWSER_EXECUTABLE=/path/to/chromium`; the helper never installs a browser or disables its sandbox. If Playwright is missing, do not install silently: use the agent's own browser tool if it has one, or skip and say "visual check not performed".
2. Build once (`npm run build`), then capture with the server handled for you (it starts `--serve` if the URL is down and stops it afterwards):
   `node <skill-dir>/scripts/screenshot.mjs --base-url http://localhost:4173 --serve "npx vite preview --port 4173" --routes auto --label after`
   (desktop 1440x900 and mobile 390x844; `contact-sheet.png` is written beside them). `--routes auto` takes the static routes found in the code; it does not cover tabs, dialogs or interaction states at the same URL. Capture those with the available browser tool or project test harness; mark unsupported states unverified. Add dynamic routes by hand with a real id (`/tickets/T-1042`), and states reachable by URL. Use the project's own preview or start script in `--serve` if it is not Vite, or start your own server and omit `--serve`. For auth-gated routes use the app's own dev login, or report them as not captured. Do not change ports or env files to make it start.
3. For async pages, pass `--ready-selector "<page-specific selector>"` instead of relying on network idle (polling apps may never idle). After navigating between pages with identically labelled forms, wait for the new page's heading/readiness marker before filling fields.
4. Look at the output: lines marked `[horizontal overflow]` or a non-ok status need fixing before you judge the design.
5. Open the **contact sheet** first, then the full-size image of each weak page and every mobile page. Never describe an image you did not open.
6. Before/after: in TRANSFORM, capture `--label before` first (same command, before editing) and run `node <skill-dir>/scripts/compare.mjs` for a side-by-side page. Match data, theme, scroll and viewport. After seeding storage, reload before capturing: hash-only navigation may retain stale in-memory state. Wait for the expected visible content, not just any heading.

For TRANSFORM, compare each stated design priority against the matching original view: what visible relationship changed, and does it solve the observed weakness? Passing tests, different pixels and a clean measured review cannot answer this. If a priority remains unmet, fix its cause within the existing two-round budget and recapture the changed views. Missing baseline or browser access must be reported, never replaced with an imagined comparison.

## Measured review
`node <skill-dir>/scripts/review.mjs --current .glowup/screenshots/after/manifest.json --before .glowup/screenshots/before/manifest.json` compares the same routes and dimensions. For CREATE, omit `--before`. It groups measured problems across routes so you can fix a shared cause once: overflow, unnamed controls, broken images, stacked global headers, keyboard-inaccessible scroll regions, simple text contrast, touch targets, and very small text. It flags lost rendered controls/links and changed fonts. Do not treat a clean result as a design score or a substitute for original behavior tests. A 44px target hint needs context for inline text, native checkboxes, and dense layouts. Contrast over images, gradients, opacity, SVG text, and blends is unverified; use a full accessibility tool when available and inspect actual surfaces.

## Review checklist (answer from what you saw)
- Focal point: does composition and type make the main task clear, with supporting context subordinate?
- Identity: Polish retains composition and identity. Full redesign retains product, brand cues, art and useful density while addressing the identified layout/hierarchy weaknesses. CREATE: does the product feel specific rather than generic?
- Consistency: same header, spacing, radius, and buttons on every route?
- Mobile (390px): no horizontal scroll, nav usable, tables handled, targets 44px, text readable.
- Contrast and states: muted text readable, focus visible, empty/error/loading designed. Check supported themes on actual canvas and surfaces. For chat/editors, test long content, a multiline draft and composer focus; a short sample cannot expose overlap.
- Regressions (TRANSFORM): everything visible before is still present and working.
Full-page screenshots show fixed or sticky bars once; confirm with `--full-page false` before "fixing" them.

Budget: two capture-review-fix rounds. Stop earlier when the checklist passes. List anything left.

## Report (15 lines or fewer)
1. Mode and direction chosen (name) and why, in one line.
2. Preserved / changed / regressed / unverified, grouping screens with the same outcome. For TRANSFORM, account for every requested screen and any unmet design priority; do not call unfinished work complete.
3. Checks run with results: build, tests, audit, screenshots actually viewed (desktop/mobile, screens/states and evidence paths).
4. Not verified or left undone, and known limitations.
5. Actual commit/publication status (only act when authorized) and how to review: `git diff --stat`.
No scores you did not compute, no claims of testing in real browsers other than the one used.
