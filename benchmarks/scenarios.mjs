// The four benchmark scenarios. The task text is identical for every condition; the only
// differences are the "/glowup-ui " prefix for skill conditions and the preview-server port.

export const MODEL = "claude-sonnet-5-5";
export const EFFORT = "medium";
export const BUDGET_USD = 6;
export const TIMEOUT_MS = 45 * 60 * 1000;

// Both conditions use the same current source; no historical Git commits are required.
export const CONDITIONS = {
  baseline: { skill: null, prefix: "" },
  current: { skill: { workingTree: true }, prefix: "/glowup-ui " },
};

const COMMON = `Work without asking questions: make every decision yourself and finish the whole task. Do not commit.`;

const FINANCE = `Build a multi-page personal finance dashboard web app in the current folder (it is empty).
Use React, Vite, Tailwind CSS, and React Router. Use local sample data only; there is no backend.

Routes:
- / : Overview. Show stats labelled "Net worth", "Monthly spending" and "Savings rate", a spending trend, and recent transactions.
- /transactions : a table of at least 20 sample transactions (date, description, category, amount). A search box labelled "Search transactions" filters the rows. A select labelled "Category" filters by category. A button "Add transaction" opens a dialog (role dialog) with fields labelled "Description", "Amount", "Category" and "Date" and a "Save" button that adds the transaction to the table.
- /budgets : a monthly budget per category with progress against actual spending.
- /reports : spending by category for the month, and income versus expenses over six months.
- /settings : a form with fields labelled "Display name" and "Email" and a "Save changes" button that shows a confirmation message.
- /login : fields labelled "Email" and "Password" and a "Log in" button that goes to /.

It must work well on a desktop and on a phone (390px wide). Add a few automated tests for the core behavior, and make \`npm run build\` and \`npm test\` pass.`;

const STORE = `Build a multi-page online store for "Fieldnote", a small independent shop that sells stationery and desk goods, in the current folder (it is empty).
Use React, Vite, Tailwind CSS, and React Router. Use local sample data only; there is no backend.

Routes:
- / : home page that introduces the shop and features products.
- /shop : at least 12 products. A search box labelled "Search products" filters them. A select labelled "Category" filters by category. A select labelled "Sort by" has the options "Featured", "Price: low to high" and "Price: high to low" and sorts the products. Each product card links to its page.
- /products/:slug : product page with the name, price, description and an "Add to cart" button.
- /cart : the items in the cart with buttons "Increase quantity", "Decrease quantity" and "Remove" for each item, a "Subtotal", and a "Checkout" link. The site header has a link named "Cart" that shows the number of items in the cart.
- /checkout : a form with fields labelled "Email", "Full name", "Address", "City" and "Card number" and a "Place order" button that goes to /confirmation.
- /confirmation : shows the text "Order confirmed" and an order summary.

It must work well on a desktop and on a phone (390px wide). Add a few automated tests for the core behavior, and make \`npm run build\` and \`npm test\` pass.`;

const REDESIGN = (what) => `Redesign the whole ${what} so it looks excellent and professional on desktop and on a phone. Make a meaningful, cohesive redesign across every page, not a few small tweaks.
Preserve all functionality, routes, content and data. The tests in tests/ describe the current behavior: do not edit them, and make sure \`npm run build\` and \`npm test\` pass.`;

export const SCENARIOS = {
  A: {
    id: "A", kind: "create", title: "Finance dashboard from scratch", flow: "finance",
    routes: ["/", "/transactions", "/budgets", "/reports", "/settings", "/login"],
    task: FINANCE,
  },
  B: {
    id: "B", kind: "create", title: "E-commerce website from scratch", flow: "store",
    routes: ["/", "/shop", "/cart", "/checkout", "/confirmation"],
    task: STORE,
  },
  C: {
    id: "C", kind: "transform", title: "SaaS dashboard redesign (helpdesk)", fixture: "helpdesk-before",
    routes: ["/", "/tickets", "/tickets/T-1042", "/customers", "/reports", "/settings", "/login", "/tickets?simulate=empty", "/tickets?simulate=error"],
    task: REDESIGN("Beacon Helpdesk app (a SaaS dashboard for support teams)"),
  },
  E: {
    id: "E", kind: "transform", title: "Preserve and refine a designed app", fixture: "plotline-designed",
    routes: ["/", "/projects", "/projects/p2", "/team", "/settings", "/login", "/projects?simulate=empty", "/projects?simulate=error"],
    task: `Improve the existing Plotline app's usability, consistency, mobile layout, and accessibility. It already has a designed identity: preserve its paper/vermilion palette, Fraunces headings, logo, charts, illustrations, content, and navigation. Make targeted improvements supported by real weaknesses; leave already-good pages alone. Preserve all routes, behavior, data, and tests; make npm run build and npm test pass.`,
  },
  D: {
    id: "D", kind: "transform", title: "Booking website redesign (spa)", fixture: "booking-before",
    routes: ["/", "/services", "/services/hot-stone", "/book?service=swedish", "/contact", "/about", "/confirmation"],
    task: REDESIGN("Saltwater Spa booking website"),
  },
};

export const TOOL_NOTE = (port) =>
  `Notes: Playwright is installed globally. If you want screenshots, \`node tools/screenshot.mjs --base-url <url> --routes /,/a --label name\` writes PNGs and a contact sheet to .glowup/screenshots/<name>. If you run a preview server, use port ${port}.`;

export function buildPrompt(scenario, condition, port) {
  const prefix = CONDITIONS[condition].prefix;
  return `${prefix}${scenario.task}\n\n${COMMON}\n${TOOL_NOTE(port)}`;
}

// Tools every condition may use: identical permissions for all.
export const ALLOWED_TOOLS = [
  "Read", "Edit", "Write", "Glob", "Grep",
  "Bash(npm create vite@latest *)", "Bash(npm install *)", "Bash(npm install)", "Bash(npm i *)", "Bash(npm i)", "Bash(npm run *)", "Bash(npm test)", "Bash(npm ci)",
  "Bash(npx vite *)", "Bash(npx vitest *)", "Bash(node tools/*)", "Bash(node .claude/skills/glowup-ui/scripts/*)",
  "Bash(ls *)", "Bash(git status *)", "Bash(git diff *)", "Bash(curl -s *)", "Bash(mkdir *)",
];
