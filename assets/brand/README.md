# Visual identity

Original SVG artwork authored for Glowup UI in this PR. The stepped G/frame mark suggests a considered composition with one lifted corner. Forest ink, warm paper and a small chartreuse signal; no generated app mockups or third-party graphics. Text uses installed DejaVu Sans/Arial fallbacks; no font files are redistributed. Project assets are MIT licensed with this repository.

`hero.svg` is the README masthead; `hero-mobile.svg` keeps its text readable on phones. `social-preview.png` is a genuine browser rasterization of `social-preview.svg`, at GitHub's recommended 1280×640 aspect ratio. It is branding, never benchmark evidence. `mark.svg` works at small sizes.

Reproduce the PNG assets with benchmark Playwright and an available Chromium: `GLOWUP_BROWSER_EXECUTABLE=/usr/bin/chromium node benchmarks/brand-assets.mjs`. The script also writes a 320×160 thumbnail to the OS temporary directory for inspection. Browser sandbox and TLS settings remain enabled.

Set the social image through repository Settings → General → Social preview → Edit → Upload an image. The image has no embedded personal metadata.
