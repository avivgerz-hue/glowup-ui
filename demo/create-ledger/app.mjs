import {
  initialState,
  balance,
  filtered,
  transaction,
  categories,
} from "./model.mjs";
const key = "glowup-margin-v1";
let state;
try {
  state = JSON.parse(localStorage.getItem(key)) || initialState();
} catch {
  state = initialState();
}
const save = () => localStorage.setItem(key, JSON.stringify(state));
const money = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const monthIncome = () =>
  state.transactions
    .filter((t) => t.amountCents > 0)
    .reduce((sum, t) => sum + t.amountCents, 0);
const monthSpent = () =>
  -state.transactions
    .filter((t) => t.amountCents < 0)
    .reduce((sum, t) => sum + t.amountCents, 0);
function rows(items) {
  if (!items.length)
    return '<tr><td colspan="4" class="empty">No transactions match. Try another search or category.</td></tr>';
  return items
    .map(
      (t) =>
        `<tr><td><span class="merchant-icon" aria-hidden="true">${escape(t.merchant[0])}</span><strong>${escape(t.merchant)}</strong></td><td class="amount ${t.amountCents > 0 ? "positive" : ""}">${t.amountCents > 0 ? "+" : "−"}${money(Math.abs(t.amountCents))}</td><td><span class="category">${escape(t.category)}</span></td><td class="date">${new Date(t.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</td></tr>`,
    )
    .join("");
}
const table = (items) =>
  `<div class="table-scroll" role="region" aria-label="Transactions, horizontally scrollable" tabindex="0"><table><thead><tr><th>TRANSACTION</th><th class="amount">AMOUNT</th><th>CATEGORY</th><th>DATE</th></tr></thead><tbody>${rows(items)}</tbody></table></div>`;
function chart() {
  const values = [
    15400,
    16900,
    16300,
    18400,
    17800,
    21000,
    balance(state) / 100,
  ];
  const points = values
    .map((v, i) => `${i * 100},${170 - (v - 14000) / 90}`)
    .join(" ");
  return `<svg class="balance-chart" viewBox="0 0 600 200" role="img" aria-label="Balance trend from May to October, ending at ${money(balance(state))}"><path d="M0 45H600M0 105H600M0 165H600" stroke="currentColor" opacity=".13" fill="none"/><polyline points="${points}" fill="none" stroke="#d3f1b8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="600" cy="${170 - (values.at(-1) - 14000) / 90}" r="5" fill="#d3f1b8"/><g fill="currentColor" opacity=".75" font-size="12"><text y="195">MAY</text><text x="195" y="195">JUL</text><text x="395" y="195">SEP</text><text x="565" y="195">OCT</text></g></svg>`;
}
function render() {
  const route = ["overview", "activity", "settings"].includes(
    location.hash.slice(1),
  )
    ? location.hash.slice(1)
    : "overview";
  document.querySelectorAll("[data-route]").forEach((link) => {
    if (link.dataset.route === route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.querySelector("#profile-name").textContent = state.name;
  document.querySelector("#breadcrumb").textContent = document.querySelector(
    "#page-title",
  ).textContent = {
    overview: "Overview",
    activity: "Your activity",
    settings: "Settings",
  }[route];
  document.querySelector("#page-lede").textContent = {
    overview: "Room to breathe. A clear view of what comes next.",
    activity: "Every little detail, in one place.",
    settings: "Make a little space for your preferences.",
  }[route];
  const view = document.querySelector("#view");
  if (route === "overview") {
    const income = monthIncome(),
      spent = monthSpent();
    view.innerHTML = `<div class="overview-grid"><section class="balance-panel"><div class="panel-top"><span>AVAILABLE BALANCE</span><span class="account-badge">PERSONAL · USD</span></div><p class="big-balance">${money(balance(state))}</p><p class="balance-note"><span class="trend">${income >= spent ? "+" : ""}${money(income - spent)}</span> net movement this month</p>${chart()}</section><section class="month-panel"><p class="eyebrow">OCTOBER AT A GLANCE</p><h2>A healthy balance.</h2><p class="muted">A little intention goes a long way.</p><div class="monthly-row"><span><i class="income-icon" aria-hidden="true">+</i> Money in</span><strong>${money(income)}</strong></div><div class="monthly-row"><span><i class="expense-icon" aria-hidden="true">−</i> Money out</span><strong>${money(spent)}</strong></div><div class="savings"><span>Kept this month</span><strong>${income ? Math.round(((income - spent) / income) * 100) : 0}%</strong><div class="meter"><span style="width:${income ? Math.max(0, Math.min(100, ((income - spent) / income) * 100)) : 0}%"></span></div></div></section></div><section class="activity-panel"><div class="section-heading"><div><p class="eyebrow">THE EVERYDAY DETAILS</p><h2>Recent activity</h2></div><a class="text-link" href="#activity">View all activity <svg aria-hidden="true" viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 15 15 4M6 4h9v9"/></svg></a></div>${table(state.transactions.slice(0, 5))}</section><div class="quiet-note"><span aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="m12 1 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/></svg></span><span><strong>More clarity. Less noise.</strong> This is a local example with fictional transactions.</span></div>`;
  } else if (route === "activity") {
    view.innerHTML = `<section class="activity-panel"><div class="filters"><label>Search transactions<input id="search" type="search" placeholder="Search a name or category"></label><label>Category<select id="filter" aria-label="Category"><option value="">All categories</option>${categories.map((c) => `<option>${c}</option>`).join("")}</select></label><span id="result-count" role="status">${state.transactions.length} transactions</span></div>${table(state.transactions)}</section>`;
    const update = () => {
      const items = filtered(
        state.transactions,
        document.querySelector("#search").value,
        document.querySelector("#filter").value,
      );
      view.querySelector("tbody").innerHTML = rows(items);
      document.querySelector("#result-count").textContent =
        `${items.length} transactions`;
    };
    document.querySelector("#search").addEventListener("input", update);
    document.querySelector("#filter").addEventListener("change", update);
  } else {
    view.innerHTML = `<section class="settings-panel"><p class="eyebrow">YOUR WORKSPACE</p><h2>Keep it personal.</h2><form id="settings"><label>Display name<input name="name" required maxlength="40" value="${escape(state.name)}"></label><label>Currency<select disabled aria-describedby="currency-note"><option>USD — US Dollar</option></select></label><p id="currency-note" class="muted">This demo uses fixed USD sample data.</p><button class="primary">Save preferences</button><p role="status" id="settings-status"></p></form></section>`;
    document.querySelector("#settings").addEventListener("submit", (event) => {
      event.preventDefault();
      state.name = new FormData(event.target).get("name").trim() || "Avery";
      save();
      document.querySelector("#profile-name").textContent = state.name;
      document.querySelector("#settings-status").textContent =
        "Preferences saved.";
    });
  }
}
const dialog = document.querySelector("dialog");
document.querySelector("#add").addEventListener("click", () => {
  document.querySelector("#form-error").textContent = "";
  dialog.showModal();
});
document
  .querySelector("#close")
  .addEventListener("click", () => dialog.close());
document
  .querySelector("#transaction-form")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const t = transaction(
        Object.fromEntries(new FormData(event.target)),
        crypto.randomUUID(),
      );
      state.transactions.unshift(t);
      save();
      dialog.close();
      event.target.reset();
      render();
    } catch (error) {
      document.querySelector("#form-error").textContent = error.message;
    }
  });
addEventListener("hashchange", render);
render();
