# Design decisions, in order of impact

Use this decision system for the requested scope. Preserve existing brand; recipes never authorize changing behavior or inventing data/content.

## Composition before cosmetics
Name the page's job: overview, collection, detail, form or presentation. Give its primary content a dominant region and put the main action nearby. Secondary context gets less area/emphasis, not less legibility. Replace equal-weight panels with a purposeful hierarchy when the content warrants it. A collection needs filtering and scan rhythm; a detail needs identity and related context; a form needs grouped choices, errors and completion feedback. Do not impose the same card grid on every route.

Choose grid ratios from content: selection plus summary often needs roughly 2:1; dense tables need available width; narrative prose needs about 45–75 characters per line. Use minmax and wrapping so the desktop composition collapses in meaningful reading order. Change a shared layout once instead of applying page-specific offsets. Global navigation and notifications appear once.

## Type with a job
Use three recognizable roles: page/title, content/control, metadata. In dense tools, start with one readable family, body 14–16px with comfortable leading, a 24–32px page title, restrained weight differences and tabular aligned numbers. In editorial/presentation work, a 40–72px fluid display title may fit; keep body around 16–18px and readable line length. These are starting ranges, not quotas. Phone headings must wrap without clipping.

Use at most two families when establishing a new identity: an expressive display face only where it supports the product, a quiet body face for long text and controls. Preserve existing families in branded apps and polish; improve size, weight, leading and measure first. A new font is not a substitute for hierarchy. Avoid using pale color or tiny size as the only way to make metadata subordinate.

## Rhythm and reusable components
Use a small spacing scale (for example 4, 8, 12, 16, 24, 32, 48). Space between groups should exceed space within them. Define title, section, row and control recipes once. Align baselines, control heights, label spacing and numeric columns across routes. Use whitespace first, borders where grouping needs help and elevation for actual layering. Pick one coherent radius/surface language; not every group needs a card.

## Product-specific expression
Use the product task to select composition, not just accent color. `composition.mjs` gives compact recipes for financial comparison, merchandise/selection, operational work lists, portfolios, booking and conversation interfaces. Keyword selection is a heuristic; override it when the task differs. Existing content is the source of visual interest: imagery in commerce, meaningful trends in finance, project work in portfolios. One repeated caption, divider or status treatment is enough. No gratuitous chart/art quota or fabricated claims.

## Color and interaction
Use semantic roles: canvas, surface, ink, muted, action, status. Check actual pairs: ordinary text 4.5:1, large text 3:1, meaningful control boundaries 3:1. Status needs text/icon as well as color. Retain brand assets and mode support. Keep visible focus and distinguish selected, unavailable, loading and error states. Links navigate, buttons act; forms have persistent labels and associated errors. Reuse working dialogs and their focus behavior.

## Phone and accessibility are design inputs
Check 390px and desktop plus important breakpoints. Stack by task order; keep search/actions discoverable. For reading pages, let content determine height. For chat/editing workspaces, use a flexible scroll region and reserve layout space for the composer/toolbar; test long content and a short viewport so fixed bars cannot cover focused controls. Keep wide tables in named keyboard-scrollable containers with headers and all fields accessible. Aim for 44px touch targets, respecting dense/native controls. Use semantic landmarks, a page heading, stable accessible names and keyboard order. Never hide useful information solely to clean up a screenshot. Respect reduced motion.

## Acceptance from actual views
For full work compare hierarchy, composition, shared controls, cross-page consistency and phone usability against the baseline. Explain concrete differences, including losses. Build/tests measure function; rendered issue counts measure specific defects; neither establishes taste. An unavailable browser means visual quality is unverified.
