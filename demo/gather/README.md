# Gather: a complete, local four-screen demonstration

Fictional event-management app. No accounts, APIs, email delivery, paid services, analytics, external assets or dependencies. RSVP and preferences use browser-local storage. Run either version from its own directory with `npm start`; `npm test` runs the original six domain tests and `npm run build` creates static files in `dist/`. Both listen on loopback port3000 by default; set `PORT` explicitly when running both.

- `before/`: built by a fresh-context agent without any design skill, using its normal best effort.
- `after/`: an independent fresh-context agent received the same source, read the complete Glowup UI **0.2.0-dev.1** instructions and relevant references, and implemented TRANSFORM across Overview, Events, Guests, Settings and detail/RSVP dialogs. This predates the dev.2 routing correction; do not relabel it as a later skill version.

The shared masthead gives collections more width; event rows expose dates/attendance; phone guest cards retain all fields; settings and forms share a clearer hierarchy. Original SVG artwork, content, routes, domain tests and logic remain. A minimal theme-token repair in the after version fixes inherited unreadable dark headings. Both copies have the same loopback-only demo-server hardening, separate from visual implementation.

**This is a sequential workflow demonstration, not an equal-budget skill-versus-no-skill experiment.** The after version received an additional editing pass. No independent human preference, native host activation, causal superiority or speed advantage is claimed. Original source and limitations remain inspectable. The independent finance/booking pilot is reported separately.

Reproduce matching captures and actual interactions with Node22, benchmark dependencies and an available Chromium: `node benchmarks/gather-showcase.mjs` from the repository root. `--write` deliberately replaces this example's captures; `--check` validates it without replacing assets. Screenshots use1440×900 and390×844, fixed clock/data, light theme and identical screen/dialog states. The browser harness uses Playwright's default launch configuration inside the execution environment; this does not mean Chromium's internal OS sandbox is enabled.
