# Contributing

Glowup UI maintains one canonical Agent Skills payload under `skills/glowup-ui/`. Keep instructions concise and framework-independent. Helpers remain dependency-free and support Node 20+. Starter files end in `.tpl`.

## Checks

```bash
npm test
node bin/glowup-ui.mjs validate
```

The browser suite uses Node 22:

```bash
cd benchmarks
npm ci
npx playwright install chromium
npm run test:browser
node chat-journey.mjs --out /absolute/path/to/private-evidence
```

Alternatively set `GLOWUP_BROWSER_EXECUTABLE` to an existing Chromium. Demo apps under `demo/before` and `demo/after` have their own locked dependencies, tests and builds. Read [benchmarks](benchmarks/README.md) before interpreting results.

## Changes and evidence

Preserve existing functionality and tests. Test meaningful helper changes. Changes to agent instructions need completed comparisons with identical tasks, model settings and tools. Do not describe a scripted fixture change, successful install or skill listing as proof of activation or design superiority. Retain negative findings honestly.

Do not commit generated logs, credentials, private reports, backup bundles, review keys or machine-specific manifests. Check effective Git author AND committer; maintainers use their GitHub username and verified GitHub noreply address. Never import history from another repository. Preserve third-party licenses and attribution.

Use the [security policy](SECURITY.md) for sensitive findings. Contributions are MIT licensed. Open focused pull requests with the concrete change, reason and actual validation. Publication and visibility changes require owner authorization.
