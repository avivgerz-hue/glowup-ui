# CREATE mode

Build a new app, site, or page that looks designed from the first screenshot. Target: a finished, multi-page result in one pass, not a template you restyle later.

## 1. Brief (extend the opening scope statement; no separate plan)
Product and audience; only the routes or screens needed by the request; the key data and its realistic sample values; the main action per screen; surface type; brand constraints. Choose routes that make a complete product (a store has browse, product, cart, checkout, confirmation; a dashboard has overview, a list, a detail or report, settings, sign-in).

Compare two or three composition directions using [design-decisions.md](design-decisions.md) before committing to the first implementation, unless the user has already specified the direction. Choose from real content and constraints; do not build multiple prototypes.

## 2. Project in one call
New project (no `package.json`):
```
node <skill-dir>/scripts/scaffold.mjs --name "<Name>" --product "<product and audience>" --surface <app|marketing|commerce|editorial|service> --install
```
This creates a Vite + React 19 + React Router + Tailwind v4 + Vitest project with `npm test` and `npm run build` ready, writes `src/index.css` (direction theme with fonts, color roles, radii, shadows), declares its fonts in the generated manifest before one install, copies a minimal working kit to `src/ui`, and prints the direction brief. `--kit full` opts into all visuals, page blocks, and shells; do not load that code unless the product needs it. Read the direction and product composition brief; verify its fit, then commit to one layout and type hierarchy. Override a mismatched keyword recipe instead of forcing it.

Existing project, new pages: use TRANSFORM and compose the existing shell, tokens, and controls. Do not scaffold a second design system inside an app.
Other stack (Next, Vue, Svelte): keep that stack; use `direction.mjs --plain` for CSS variables and re-create the same primitives in the stack's idiom.

## 3. Build the product's composition, then add only what it needs
The default kit contains PageHeader, Button, Field, Card, and their dependencies. Add modules with `scaffold.mjs --only ui --components Table,Dialog --dir src` (dependencies are included); existing files/barrels remain untouched, so import new modules directly. The full catalog below is optional, not a reading list. Full-kit shells live in `src/shells`.

Before adding pages, make the primary screen work at 390px and 1440px: lead with the user's main task and meaningful content; choose an intentional width/density, one clear action hierarchy, and one product-specific visual treatment. Review this screen once, then reuse the working foundation. Do not generate multiple disposable designs or add decoration to compensate for unclear hierarchy.

Import existing kit exports from `./ui` or directly by module. Tokens in use: `bg-canvas surface raised sunken`, `border-line`, `text-ink muted`, `bg-primary text-on-primary`, `bg-primary-soft text-primary-ink`, `accent-*`, `ok/warn/bad/info` with `-soft` and `-ink`, `rounded-control/card/sheet/pill`, `shadow-card/pop`, `font-display/sans/mono`.

- **Primitives:** `Button` (+`buttonClass` for links), `Input`/`Select`/`Textarea`, `Checkbox`/`Radio`/`Switch`, `Badge`, `Card`/`CardHeader`, `Avatar`/`AvatarStack`, `Progress`/`ProgressRing`, `Table`/`Th`/`Td` (scrolls in its own box), `Dialog` (native), `EmptyState`/`ErrorState`/`Skeleton`, `PageHeader`, `Icon` (about 65 icons; add paths as needed).
- **Page blocks (`Layouts`):** `Hero`, `AuthSplit`, `Section` (settings rows, `tone="danger"`), `Stat` + `StatStrip` (one hero figure, not equal cards), `DetailLayout`, `Toolbar`, `TileCard`, `Stepper`, `SummaryRail`, `SiteFooter`. A page is data plus a few of these.
- **Visuals:** charts `LineChart`/`ColumnChart`/`BarList`/`Donut`/`Sparkline`; `Illustration` (notebook, pen, mug, tote, plant, candle, stones, drop, parcel, chart, wallet, ticket, calendar, shield, drawn in the theme colors) inside `ArtTile`; motifs `Rings`/`Waves`/`Contours`/`GridPaper`/`Dots`/`Stripes`/`Blob`/`Arch`/`Edge`. For a product the library lacks, draw 3-6 flat shapes inline instead of using a monogram.
- **Full-kit shells:** `SidebarShell` (sidebar, bottom tabs on phones) and `TopBarShell` (menu panel on phones).

Make it this product's own: **edit the shell, headings, card and button recipes to the direction's shell, motif, and signature moves** (a ruled paper header, stitched borders, a rail, tonal panels). Reorder, wrap, or copy blocks into pages and change them. Leaving the kit untouched on every page gives a clean but generic result.

## 4. Build
1. Data module first (`src/data.js`): realistic, specific sample data with correct totals; one small store or context only if state crosses pages.
2. Shell and routes (`src/routes.jsx`), then each page whole, following the recipes in design-quality.md. Lead with the focal element; add data visuals (inline-SVG charts, bars, rings, ArtTiles) where there are numbers or products.
3. Lists and data views: implement the states the actual flow can reach; do not invent async errors or loading loops for synchronous local data.
4. Forms: labelled fields, validation messages, a working submit that updates state or navigates.
5. Tests (4 to 8, in `tests/`): routes render, the main flow works (add to cart, add transaction, submit booking), a form validates, the empty state appears. Role- and label-based queries.
6. Run `npm run build`, `npm test`, and `node <skill-dir>/scripts/lint.mjs src`; fix failures.

## 5. Check
Follow [verification.md](verification.md). Reuse the build and preview server when available; capture desktop/mobile of the requested routes, inspect, fix observed problems, and recapture only affected views. Stop any server you started.

## Quality notes specific to new builds
- Content is design: real names, plausible prices and dates, product-specific microcopy. No lorem ipsum, no "Acme", no feature claims that imply integrations that do not exist.
- Make the primary task and product identity convincing. Choose a visual treatment the content supports (a real trend, product imagery, a timeline), rather than meeting a quota of charts and art. Reuse a kit visual before drawing a new one. A useful, composed screen beats a larger collection of decorative blocks.
- Variety across pages: a different composition per page type; avoid the same card grid repeated.
