#!/usr/bin/env node
// Real browser journeys before/after the same controlled edits used by quality-smoke.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { sh, startPreview } from "./lib/proc.mjs";
import { improve } from "./lib/refine-edits.mjs";
import { SCENARIOS } from "./scenarios.mjs";
import { loadPlaywright, browserOptions } from "../skills/glowup-ui/scripts/screenshot.mjs";
import { snapshot, check } from "../skills/glowup-ui/scripts/checkpoint.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = fs.mkdtempSync(path.join(os.tmpdir(), "glowup-refine-journeys-"));
const out = path.join(here, "results/refine-journeys");
fs.mkdirSync(out, { recursive: true });
const result = { kind: "native Chromium flows on controlled app copies; no model quality/cost claim", createdAt: new Date().toISOString(), node: process.version, flows: [], pass: false };
fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result));
let browser;
async function journey(page, url, id) {
  const passed = [];
  const visible = async (locator, name) => { await locator.waitFor({ state: "visible" }); passed.push(name); };
  if (id === "C") {
    await page.goto(url + "/tickets");
    await page.getByRole("link", { name: "Cannot export invoices to CSV", exact: true }).waitFor();
    await page.getByLabel("Search tickets").fill("webhook");
    await visible(page.getByRole("link", { name: "Webhook deliveries failing", exact: true }), "ticket search");
    assert.equal(await page.getByRole("link", { name: "Cannot export invoices to CSV", exact: true }).count(), 0);
    await page.getByLabel("Search tickets").fill("");
    await page.getByLabel("Status", { exact: true }).selectOption("solved");
    await page.getByLabel("Priority", { exact: true }).selectOption("urgent");
    await visible(page.getByText("No tickets found.", { exact: true }), "empty filtered state");
    await page.getByRole("button", { name: "Clear filters" }).click();
    await page.getByRole("link", { name: "Cannot export invoices to CSV", exact: true }).click();
    await page.getByLabel("Reply", { exact: true }).fill("Browser regression reply.");
    await page.getByRole("button", { name: "Send reply", exact: true }).click();
    await visible(page.getByText("Browser regression reply.", { exact: true }), "ticket reply");
    assert.equal(await page.getByLabel("Reply", { exact: true }).inputValue(), "");
    await page.getByLabel("Status", { exact: true }).selectOption("solved");
    assert.equal(await page.getByLabel("Status", { exact: true }).inputValue(), "solved");
    passed.push("status update");
  } else if (id === "D") {
    await page.goto(url + "/services");
    await page.getByLabel("Category", { exact: true }).selectOption("Facials");
    await visible(page.getByRole("link", { name: "Radiance Facial", exact: true }), "service category filter");
    assert.equal(await page.getByRole("link", { name: "Deep Tissue Massage", exact: true }).count(), 0);
    await page.getByLabel("Search services").fill("zzz");
    await visible(page.getByText("No services match your search.", { exact: true }), "empty service search");
    await page.goto(url + "/book?service=swedish");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await visible(page.getByRole("alert"), "booking date validation");
    await page.getByLabel("Date", { exact: true }).fill("2026-11-12");
    assert.equal(await page.getByRole("radio", { name: /9:00 AM/ }).isDisabled(), true);
    await page.getByRole("radio", { name: "10:30 AM", exact: true }).check();
    passed.push("availability and time selection");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Confirm booking", exact: true }).click();
    await visible(page.getByRole("alert"), "booking name validation");
    await page.getByLabel("Name", { exact: true }).fill("Alex Morgan");
    await page.getByLabel("Email", { exact: true }).fill("alex@example.test");
    await page.getByRole("button", { name: "Confirm booking", exact: true }).click();
    await visible(page.getByRole("heading", { name: "Booking confirmed", exact: true }), "complete booking and confirmation");
    await page.goto(url + "/contact");
    await page.getByRole("button", { name: "Send message", exact: true }).click();
    await visible(page.getByRole("alert"), "contact validation");
    await page.getByLabel("Name", { exact: true }).fill("Sam");
    await page.getByLabel("Email", { exact: true }).fill("sam@example.test");
    await page.getByLabel("Message", { exact: true }).fill("Do you offer gift cards?");
    await page.getByRole("button", { name: "Send message", exact: true }).click();
    await visible(page.getByRole("status"), "contact submit");
  } else {
    await page.goto(url + "/projects");
    await page.getByLabel("Search projects").fill("zzzz");
    await visible(page.getByText("No projects found.", { exact: true }), "empty project search");
    await page.getByLabel("Search projects").fill("");
    await page.getByRole("link", { name: "Atlas mobile app", exact: true }).click();
    const task = page.getByRole("checkbox", { name: "Onboarding flow" });
    const wasChecked = await task.isChecked(); await task.click();
    assert.notEqual(await task.isChecked(), wasChecked); passed.push("project task toggle");
  }
  if (id !== "D") {
    await page.goto(url + "/settings");
    await page.getByLabel("Email", { exact: true }).fill("bad");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await visible(page.getByText("Enter a valid email address.", { exact: true }), "settings validation");
    await page.getByLabel("Email", { exact: true }).fill("ana@example.test");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await visible(page.getByRole("status"), "settings save");
    await page.getByRole("link", { name: "Log out", exact: true }).focus();
    await page.keyboard.press("Enter"); await page.waitForURL("**/login");
    // History can update before React replaces Settings' identically labelled Email input.
    await page.getByRole("heading", { name: id === "C" ? "Sign in to Beacon Helpdesk" : "Log in to Plotline", exact: true }).waitFor();
    await page.getByLabel("Email", { exact: true }).fill("ana@example.test");
    await page.getByLabel("Password", { exact: true }).fill("secret");
    await page.getByRole("button", { name: id === "C" ? "Sign in" : "Log in", exact: true }).click();
    await page.waitForURL(url + "/"); passed.push("keyboard logout and login");
  }
  return passed;
}

try {
  const pw = await loadPlaywright(); if (!pw) throw new Error("Playwright required");
  browser = await pw.chromium.launch(browserOptions());
  for (const id of ["E", "C", "D"]) {
    const cwd = path.join(root, id);
    fs.cpSync(path.join(here, "fixtures", SCENARIOS[id].fixture), cwd, { recursive: true });
    const run = (args) => { const r = sh("npm", args, { cwd }); if (r.status !== 0) throw new Error(r.out); };
    run(["ci", "--no-audit", "--no-fund"]);
    const baseline = snapshot(cwd);
    for (const phase of ["before", "after"]) {
      if (phase === "after") improve(cwd, id);
      run(["run", "build"]);
      const server = await startPreview(cwd, 4499);
      try {
        for (const width of [390, 1440]) {
          const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
          const page = await context.newPage(); page.setDefaultTimeout(7000);
          try { const assertions = await journey(page, server.url, id); result.flows.push({ id, phase, width, pass: true, assertions }); }
          catch (error) { result.flows.push({ id, phase, width, pass: false, url: page.url(), error: error.message, alerts: await page.getByRole("alert").allTextContents() }); }
          finally { await context.close(); }
        }
      } finally { server.stop(); }
    }
    assert.equal(check(cwd, baseline).ok, true, `${id}: source preservation`);
  }
  result.pass = result.flows.length === 12 && result.flows.every((f) => f.pass);
} catch (error) { result.error = error.message; }
finally { await browser?.close(); fs.writeFileSync(path.join(out, "result.json"), JSON.stringify(result, null, 2) + "\n"); fs.rmSync(root, { recursive: true, force: true }); }
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
