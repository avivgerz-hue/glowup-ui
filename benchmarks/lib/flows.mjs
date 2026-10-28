// Scripted user journeys for the from-scratch scenarios. They use only the labels and
// names written into the task prompt, so every condition is held to the same contract.

import { loadPlaywright, browserOptions } from "../../skills/glowup-ui/scripts/screenshot.mjs";

async function runSteps(page, steps) {
  const results = [];
  for (const [name, fn] of steps) {
    try {
      await fn();
      results.push({ name, pass: true });
    } catch (error) {
      results.push({ name, pass: false, error: String(error.message).split("\n")[0].slice(0, 160) });
    }
  }
  return results;
}

const ok = (cond, msg) => { if (!cond) throw new Error(msg); };
const hasText = async (page, re) => ok(await page.getByText(re).first().isVisible(), `text ${re} not visible`);

function financeSteps(page, base, mobile) {
  const go = (p) => page.goto(new URL(p, base).href, { waitUntil: "networkidle" });
  let rowCount = 0;
  return [
    ["login goes to /", async () => {
      await go("/login");
      await page.getByLabel("Email").first().fill("alex@example.test");
      await page.getByLabel("Password").first().fill("secret");
      await page.getByRole("button", { name: /log in/i }).click();
      await page.waitForURL((u) => u.pathname === "/", { timeout: 4000 });
    }],
    ["overview shows the three stats", async () => {
      await go("/");
      for (const label of [/net worth/i, /monthly spending/i, /savings rate/i]) await hasText(page, label);
    }],
    ["transactions table has 20+ rows", async () => {
      await go("/transactions");
      rowCount = await page.locator("tbody tr").count();
      ok(rowCount >= 20, `only ${rowCount} body rows`);
    }],
    ["search filters rows", async () => {
      const box = page.getByLabel("Search transactions").first();
      await box.fill("zzzzqq");
      await page.waitForTimeout(200);
      ok((await page.locator("tbody tr").count()) < rowCount, "row count did not drop");
      await box.fill("");
      await page.waitForTimeout(200);
      ok((await page.locator("tbody tr").count()) === rowCount, "rows not restored");
    }],
    ["category select filters", async () => {
      const sel = page.getByLabel("Category").first();
      const options = await sel.locator("option").count();
      ok(options >= 2, "select has fewer than 2 options");
      await sel.selectOption({ index: 1 });
      await page.waitForTimeout(200);
      ok((await page.locator("tbody tr").count()) <= rowCount, "rows increased");
      await sel.selectOption({ index: 0 });
    }],
    ["add transaction via dialog", async () => {
      await go("/transactions");
      await page.getByRole("button", { name: /add transaction/i }).click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor({ state: "visible", timeout: 4000 });
      await dialog.getByLabel("Description").fill("Benchmark coffee");
      await dialog.getByLabel("Amount").fill("12.5");
      await dialog.getByLabel("Date").fill("2026-10-20");
      const cat = dialog.getByLabel("Category");
      if ((await cat.evaluate((el) => el.tagName)) === "SELECT") await cat.selectOption({ index: 1 });
      else await cat.fill("Food");
      await dialog.getByRole("button", { name: /^save/i }).click();
      await dialog.waitFor({ state: "hidden", timeout: 4000 });
      await hasText(page, /benchmark coffee/i);
    }],
    ["budgets page renders", async () => { await go("/budgets"); ok((await page.locator("body").innerText()).length > 200, "page is nearly empty"); }],
    ["reports page renders", async () => { await go("/reports"); ok((await page.locator("body").innerText()).length > 200, "page is nearly empty"); }],
    ["settings saves with confirmation", async () => {
      await go("/settings");
      await page.getByLabel("Display name").fill("Alex Morgan");
      await page.getByLabel("Email").first().fill("alex@example.test");
      await page.getByRole("button", { name: /save changes/i }).click();
      await hasText(page, /saved|updated|success/i);
    }],
    ...(mobile ? [["mobile: can reach Transactions from home", async () => {
      await go("/");
      let link = page.getByRole("link", { name: /transactions/i }).first();
      if (!(await link.isVisible())) {
        await page.getByRole("button", { name: /menu|navigation|open/i }).first().click();
        link = page.getByRole("link", { name: /transactions/i }).first();
      }
      await link.click();
      await page.waitForURL((u) => u.pathname === "/transactions", { timeout: 4000 });
    }]] : []),
  ];
}

function storeSteps(page, base, mobile) {
  const go = (p) => page.goto(new URL(p, base).href, { waitUntil: "networkidle" });
  const productHrefs = async () => [...new Set(await page.locator('a[href^="/products/"]').evaluateAll((els) => els.map((e) => e.getAttribute("href"))))];
  let total = 0;
  return [
    ["shop lists 10+ products", async () => { await go("/shop"); total = (await productHrefs()).length; ok(total >= 10, `only ${total} product links`); }],
    ["search filters products", async () => {
      const box = page.getByLabel("Search products").first();
      await box.fill("zzzzqq");
      await page.waitForTimeout(250);
      ok((await productHrefs()).length === 0, "products still shown for a nonsense query");
      await box.fill("");
      await page.waitForTimeout(250);
      ok((await productHrefs()).length === total, "products not restored");
    }],
    ["category and sort controls exist", async () => {
      ok((await page.getByLabel("Category").first().locator("option").count()) >= 2, "Category select missing options");
      ok((await page.getByLabel("Sort by").first().locator("option").count()) >= 3, "Sort by select missing options");
    }],
    ["sort low-to-high orders prices", async () => {
      await page.getByLabel("Sort by").first().selectOption({ label: "Price: low to high" });
      await page.waitForTimeout(300);
      const prices = await page.locator('a[href^="/products/"]').evaluateAll((els) => {
        const seen = new Set(); const out = [];
        for (const a of els) {
          if (seen.has(a.getAttribute("href"))) continue;
          const card = a.closest("li, article, div") || a;
          const m = (card.parentElement?.innerText || card.innerText).match(/\$\s?(\d+(?:\.\d{1,2})?)/);
          if (m) { out.push(Number(m[1])); seen.add(a.getAttribute("href")); }
        }
        return out.slice(0, 5);
      });
      ok(prices.length >= 3, "could not read prices");
      ok(prices.every((p, i) => i === 0 || p >= prices[i - 1]), `not ascending: ${prices.join(", ")}`);
    }],
    ["product page has Add to cart", async () => {
      await go("/shop");
      const href = (await productHrefs())[0];
      await page.locator(`a[href="${href}"]`).first().click();
      await page.waitForURL((u) => u.pathname.startsWith("/products/"), { timeout: 4000 });
      ok(await page.getByRole("button", { name: /add to cart/i }).first().isVisible(), "no Add to cart button");
    }],
    ["adding updates the header cart count", async () => {
      await page.getByRole("button", { name: /add to cart/i }).first().click();
      await page.waitForTimeout(250);
      const text = await page.getByRole("link", { name: /cart/i }).first().evaluate((e) => (e.getAttribute("aria-label") || "") + " " + e.innerText);
      ok(/[1-9]/.test(text), `cart link text has no count: "${text.trim()}"`);
    }],
    ["cart page shows item controls and subtotal", async () => {
      await page.getByRole("link", { name: /cart/i }).first().click();
      await page.waitForURL((u) => u.pathname === "/cart", { timeout: 4000 });
      await hasText(page, /subtotal/i);
      await page.getByRole("button", { name: /increase quantity/i }).first().click();
      ok(await page.getByRole("button", { name: /decrease quantity/i }).first().isVisible(), "no Decrease quantity");
      ok(await page.getByRole("button", { name: /remove/i }).first().isVisible(), "no Remove");
    }],
    ["checkout places an order", async () => {
      await page.getByRole("link", { name: /checkout/i }).first().click();
      await page.waitForURL((u) => u.pathname === "/checkout", { timeout: 4000 });
      for (const [label, value] of [["Email", "alex@example.test"], ["Full name", "Alex Morgan"], ["Address", "12 Main Street"], ["City", "Portland"], ["Card number", "4242424242424242"]]) {
        await page.getByLabel(label).first().fill(value);
      }
      await page.getByRole("button", { name: /place order/i }).click();
      await page.waitForURL((u) => u.pathname === "/confirmation", { timeout: 4000 });
      await hasText(page, /order confirmed/i);
    }],
    ...(mobile ? [["mobile: can reach Shop from home", async () => {
      await go("/");
      let link = page.getByRole("link", { name: /^shop$/i }).first();
      if (!(await link.isVisible())) {
        await page.getByRole("button", { name: /menu|navigation|open/i }).first().click();
        link = page.getByRole("link", { name: /^shop$/i }).first();
      }
      await link.click();
      await page.waitForURL((u) => u.pathname === "/shop", { timeout: 4000 });
    }]] : []),
  ];
}

export async function runFlow(flow, baseUrl) {
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch(browserOptions());
  const out = {};
  try {
    for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
      const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 600, hasTouch: vp.width < 600 });
      const page = await ctx.newPage();
      page.setDefaultTimeout(5000);
      const steps = (flow === "finance" ? financeSteps : storeSteps)(page, baseUrl, name === "mobile");
      out[name] = await runSteps(page, steps);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
  const all = [...out.desktop, ...out.mobile];
  return { ...out, passed: all.filter((s) => s.pass).length, total: all.length };
}

// First product link on /shop, so screenshots and probes can include a product page.
export async function firstProductRoute(baseUrl) {
  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch(browserOptions());
  try {
    const page = await browser.newPage();
    await page.goto(new URL("/shop", baseUrl).href, { waitUntil: "networkidle", timeout: 20000 });
    return await page.locator('a[href^="/products/"]').first().getAttribute("href");
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}
