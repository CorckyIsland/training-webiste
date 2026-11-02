// End-to-end acceptance flow in Chromium at a 360px phone and a 768px tablet width.
// Run with: node tests/e2e.mjs   (needs Playwright with Chromium available)
// Covers: the full L01 loop, draft survival across navigation and reload, export,
// restore into an empty profile, malformed and conflicting imports, clipboard
// fallback, offline editing after load, failed writes, inert imported text and
// horizontal overflow. It cannot emulate a real software keyboard.

import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, normalize } from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".md": "text/markdown" };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  try {
    const body = await readFile(join(root, path || "index.html"));
    res.writeHead(200, { "content-type": TYPES[extname(path || "index.html")] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end("not found"); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const results = [];
async function step(name, fn) {
  try { await fn(); results.push(["ok", name]); console.log(`ok   ${name}`); }
  catch (e) { results.push(["FAIL", name]); console.log(`FAIL ${name}\n     ${e.message.split("\n")[0]}`); }
}

async function noOverflow(page, where) {
  const ow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.equal(ow, 0, `horizontal overflow of ${ow}px at ${where}`);
}

async function waitSaved(page) {
  await page.waitForFunction(() => document.getElementById("save-indicator").dataset.kind === "saved");
}

async function state(page) {
  return (await page.locator(".status-card .chip").first().textContent()).trim();
}

const browser = await chromium.launch();

for (const width of [360, 768]) {
  console.log(`\n== ${width}px ==`);
  const ctx = await browser.newContext({ viewport: { width, height: width === 360 ? 740 : 1024 }, acceptDownloads: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("dialog", d => d.accept());
  let backupPath;

  await step("opening L01 records Seen only", async () => {
    await page.goto(`${BASE}#/lesson/L01`);
    await page.waitForSelector(".status-card");
    assert.equal(await state(page), "Seen");
    await noOverflow(page, "lesson start");
  });

  await step("hints do not advance the state", async () => {
    await page.getByRole("button", { name: /Show hint 1 of 2/ }).click();
    await page.waitForSelector("text=Hint 1:");
    assert.equal(await state(page), "Seen");
  });

  await step("confidence, selections and drafts autosave and survive navigation and reload", async () => {
    await page.locator("#sec-before .pill", { hasText: "3" }).click();
    await page.getByLabel("Which part do you expect to be hardest?").fill("Keeping the reply under 110 words");
    for (const t of ["The booking is confirmed.", "The total fare is NOK 1,390.", "Arrival at 10:15", "The customer requested Havna Hotel"]) await page.locator(".choice", { hasText: t }).click();
    await page.getByLabel(/Your revised reply/).fill("Hi Lea, thank you. We will check availability and a suitable vehicle. The booking is not yet confirmed. Could you send the exact date and a phone number?");
    await waitSaved(page);
    await page.getByRole("link", { name: "Today" }).click();
    await page.waitForSelector("text=One useful next step");
    await page.goto(`${BASE}#/lesson/L01`);
    await page.reload();
    await page.waitForSelector(".status-card");
    assert.match(await page.getByLabel(/Your revised reply/).inputValue(), /not yet confirmed/);
    assert.equal(await page.locator(".choice", { hasText: "The booking is confirmed." }).locator("input").isChecked(), true);
    assert.equal(await page.getByLabel("Which part do you expect to be hardest?").inputValue(), "Keeping the reply under 110 words");
  });

  await step("submitting creates Attempted with an answer-key check limited to selections", async () => {
    await page.getByRole("button", { name: "Submit attempt" }).click(); // an empty field triggers a confirm, accepted
    await page.waitForSelector("text=This check covers the selections only");
    assert.equal(await state(page), "Attempted");
    assert.ok(await page.locator("text=Not assessed:").isVisible());
    assert.ok(await page.locator(".chip", { hasText: "Selected — but supplied" }).count() >= 1);
    await noOverflow(page, "after submit");
  });

  await step("a complete rubric check gives Self-checked", async () => {
    const crits = page.locator("#sec-check .criterion");
    const n = await crits.count();
    assert.equal(n, 6);
    for (let i = 0; i < n; i++) {
      await crits.nth(i).locator(".pill", { hasText: i === 2 ? "Needs work" : "Met" }).click();
      await crits.nth(i).getByLabel("Evidence from your attempt").fill(i === 2 ? "I did not keep the wheelchair requirement." : "Reply leaves it unconfirmed.");
    }
    await page.getByRole("button", { name: "Record rubric check" }).click();
    await page.waitForSelector("text=Critical criteria not yet met");
    assert.equal(await state(page), "Self-checked");
  });

  await step("clipboard fallback: denied copy shows selectable text route", async () => {
    await page.locator("summary", { hasText: "External AI review" }).click();
    const packet = await page.getByLabel("Review packet text").inputValue();
    assert.match(packet, /L01-R1 \| Booking authority/);
    assert.ok(!packet.includes("Keeping the reply under 110 words"), "confidence notes are not in the packet");
    await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) }, configurable: true }); });
    await page.getByRole("button", { name: "Copy packet" }).click();
    await page.waitForSelector("text=Copying is blocked here");
  });

  await step("pasted AI feedback stays unverified and does not advance state", async () => {
    await page.getByLabel("Paste the AI tool’s response").fill("L01-R1 | demonstrated | says not yet confirmed\nL01-R3 | needs_revision | wheelchair requirement missing\n<script>window.__pwned=1</script>");
    await page.getByRole("button", { name: "Save pasted review" }).click();
    await page.waitForSelector(".chip:has-text('External AI review · unverified')");
    assert.equal(await state(page), "Self-checked");
    assert.equal(await page.evaluate(() => window.__pwned), undefined);
    assert.ok(await page.locator("text=<script>window.__pwned=1</script>").count() >= 1, "markup shown as text");
  });

  await step("responding to feedback gives Reviewed; provenance unchanged", async () => {
    const item = page.locator(".feedback-item", { hasText: "External AI review · unverified" });
    await item.locator(".pill", { hasText: "Amend" }).click();
    await item.getByLabel(/Your response/).fill("Agree on R3: I will keep travel seated in the wheelchair.");
    await item.locator("select").selectOption("IGNORED_REQUIREMENT");
    await item.getByRole("button", { name: "Record response" }).click();
    await page.waitForSelector("text=Your response (amend)");
    assert.equal(await state(page), "Reviewed");
    assert.ok(await page.locator(".feedback-item", { hasText: "Your response (amend)" }).locator(".chip", { hasText: "External AI review · unverified" }).count() === 1);
  });

  await step("a targeted drill is suggested with its evidence and does not change state", async () => {
    await page.waitForSelector("#sec-practice >> text=Why this drill:");
    const card = page.locator("#sec-practice .card").first();
    await card.getByLabel("Your drill answer").fill("1. Seven passengers 2. One seated in wheelchair 3. Seven cabin bags 4. Two large cases");
    await card.locator(".pill", { hasText: "Met" }).click();
    await card.getByRole("button", { name: "Save drill" }).click();
    await page.waitForSelector("text=Drills done for this revision");
    assert.equal(await state(page), "Reviewed");
  });

  await step("a checked transfer attempt gives Applied, labelled fictional", async () => {
    const sec = page.locator("#sec-transfer");
    await sec.getByLabel("Your transfer attempt").fill("Your booking for 13 June is confirmed. Please send a contact telephone number.");
    await sec.locator(".pill", { hasText: "Fictional" }).click();
    await sec.locator(".pill", { hasText: "Met" }).click();
    await sec.getByLabel("What did you compare it against?").fill("The verified facts in the changed case.");
    await sec.getByRole("button", { name: "Submit transfer attempt" }).click();
    await page.waitForSelector("text=Transfer attempts for this revision");
    assert.equal(await state(page), "Applied");
    await noOverflow(page, "after full loop");
  });

  await step("revising creates a new revision at Attempted; old checks stay with revision 1", async () => {
    await page.getByRole("button", { name: "Revise this answer" }).click();
    await page.getByLabel(/Your revised reply/).fill("Hi Lea, we will check a suitable vehicle for seven passengers, one travelling seated in a wheelchair, plus luggage. Not yet confirmed.");
    await page.getByRole("button", { name: "Submit attempt" }).click();
    await page.waitForSelector("text=Revision 2");
    assert.equal(await state(page), "Attempted");
    await page.goto(`${BASE}#/work`);
    await page.waitForSelector("text=Attempts, feedback and evidence");
    const items = page.locator(".list-item", { hasText: "Submitted" });
    assert.equal(await items.count(), 2);
    assert.ok(await page.locator(".list-item .chip", { hasText: "Applied" }).count() >= 1);
  });

  await step("a model answer revealed before submitting labels guided practice only", async () => {
    await page.goto(`${BASE}#/lesson/L02`);
    await page.getByRole("button", { name: "Reveal example answer" }).click();
    await page.waitForSelector("#sec-answer >> text=Problem hypothesis");
    assert.equal(await state(page), "Seen");
    await page.getByLabel(/Provisional problem/).fill("Office staff repeatedly chase missing intake details.");
    await waitSaved(page);
    await page.getByRole("button", { name: "Submit attempt" }).click();
    await page.waitForSelector(".status-card .chip:has-text('Guided practice')");
    assert.equal(await state(page), "Attempted");
  });

  await step("offline after load: editing and local saving still work", async () => {
    await page.goto(`${BASE}#/lesson/L03`);
    await page.waitForSelector(".status-card");
    await ctx.setOffline(true);
    await page.getByLabel("Your RCCF prompt").fill("Role: help Harbour Repairs staff…");
    await waitSaved(page);
    await ctx.setOffline(false);
  });

  await step("a failed write shows 'Not saved' and an export route, never 'Saved'", async () => {
    await page.evaluate(() => { window.__origSet = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException("full", "QuotaExceededError"); }; });
    await page.getByLabel("Your RCCF prompt").fill("Role: help Harbour Repairs staff prepare drafts.");
    await page.waitForFunction(() => document.getElementById("save-indicator").dataset.kind === "error");
    assert.match(await page.locator("#save-indicator").textContent(), /Not saved/);
    assert.ok(await page.getByRole("link", { name: "Export or copy my work" }).isVisible());
    await page.evaluate(() => { Storage.prototype.setItem = window.__origSet; });
    await page.getByRole("button", { name: "Try saving again" }).click();
    await waitSaved(page);
  });

  await step("export shows its scope and downloads a JSON backup", async () => {
    await page.goto(`${BASE}#/settings/export`);
    await page.waitForSelector("text=What will be included");
    assert.ok(await page.locator("text=submitted revision(s)").count() >= 1);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download backup" }).click()]);
    backupPath = await dl.path();
    const data = JSON.parse(await readFile(backupPath, "utf8"));
    assert.equal(data.schemaVersion, 1);
    assert.ok(data.attempts.some(a => a.state === "applied"));
    assert.ok(data.attempts.some(a => a.feedback.some(f => f.provenance === "external_ai_unverified" && f.learnerResponse)));
    assert.ok(data.drafts.some(d => d.lessonId === "L03"));
    await noOverflow(page, "settings");
  });

  await step("a second browser profile does not contain this work", async () => {
    const other = await browser.newContext({ viewport: { width, height: 800 } });
    const p2 = await other.newPage();
    await p2.goto(`${BASE}#/work`);
    await p2.waitForSelector("text=No lesson work yet");
    await other.close();
  });

  await step("restore into an empty profile reproduces the records", async () => {
    const fresh = await browser.newContext({ viewport: { width, height: 900 } });
    const p3 = await fresh.newPage();
    p3.on("dialog", d => d.accept());
    await p3.goto(`${BASE}#/settings/import`);
    await p3.locator("input[type=file]").setInputFiles(backupPath);
    await p3.waitForSelector("text=new record(s) will be added");
    await p3.getByRole("button", { name: "Import", exact: true }).click();
    await p3.waitForSelector("text=Undo the last restore");
    const exported = JSON.parse(await readFile(backupPath, "utf8"));
    const restored = await p3.evaluate(() => JSON.parse(localStorage.getItem("ai-business-practice:progress:v1")).progress);
    for (const k of ["drafts", "attempts", "notes", "measurements"]) assert.deepEqual(restored[k], exported[k], k);
    await p3.goto(`${BASE}#/lesson/L01`);
    await p3.waitForSelector(".status-card");
    assert.equal(await p3.locator(".status-card .chip").first().textContent(), "Attempted"); // revision 2 is active

    // Malformed and unsupported files leave work unchanged.
    const before = await p3.evaluate(() => localStorage.getItem("ai-business-practice:progress:v1"));
    await p3.goto(`${BASE}#/settings/import`);
    await p3.getByLabel("Paste backup text").fill("{ not json");
    await p3.getByRole("button", { name: "Check pasted text" }).click();
    await p3.waitForSelector("text=This file cannot be imported. Nothing was changed.");
    await p3.getByLabel("Paste backup text").fill(JSON.stringify({ ...exported, schemaVersion: 7 }));
    await p3.getByRole("button", { name: "Check pasted text" }).click();
    await p3.waitForSelector("text=unsupported progress schema version");
    assert.equal(await p3.evaluate(() => localStorage.getItem("ai-business-practice:progress:v1")), before);

    // A conflicting record needs an explicit choice; imported markup stays inert.
    const changed = JSON.parse(JSON.stringify(exported));
    const d = changed.drafts.find(x => x.lessonId === "L03");
    d.values.revised_prompt = "Changed elsewhere <img src=x onerror=\"window.__pwned=2\">";
    changed.notes.push({ id: "imported-note", text: "<img src=x onerror=\"window.__pwned=3\"> plain note", updatedAt: new Date().toISOString(), kind: "general" });
    await p3.getByLabel("Paste backup text").fill(JSON.stringify(changed));
    await p3.getByRole("button", { name: "Check pasted text" }).click();
    await p3.waitForSelector("text=1 record(s) conflict");
    await p3.getByRole("button", { name: "Import", exact: true }).click();
    await p3.waitForSelector("text=Choose keep-local or use-imported");
    assert.equal(await p3.evaluate(() => localStorage.getItem("ai-business-practice:progress:v1")), before);
    await p3.locator(".pill", { hasText: "Use imported" }).click();
    await p3.getByRole("button", { name: "Import", exact: true }).click();
    await p3.waitForSelector("text=Undo the last restore");
    await p3.goto(`${BASE}#/work`);
    await p3.waitForSelector("text=Attempts, feedback and evidence");
    assert.ok(await p3.locator("textarea").evaluateAll(els => els.some(e => e.value.includes("plain note"))), "imported note shown");
    assert.equal(await p3.locator("main img").count(), 0, "imported markup did not create elements");
    await p3.goto(`${BASE}#/lesson/L03`);
    await p3.waitForSelector(".status-card");
    assert.match(await p3.getByLabel("Your RCCF prompt").inputValue(), /Changed elsewhere/);
    assert.equal(await p3.evaluate(() => window.__pwned), undefined);
    await fresh.close();
  });

  await step("Course shows 6 lessons and 22 outlines; skipping is labelled, not passed", async () => {
    await page.goto(`${BASE}#/course`);
    await page.waitForSelector("text=Six modules, 28 missions");
    assert.equal(await page.locator(".list-item .chip", { hasText: /^Outline$/ }).count(), 22);
    assert.equal(await page.locator(".list-item .chip", { hasText: /^Lesson L0\d$/ }).count(), 6);
    await page.locator(".list-item", { hasText: "M03-03" }).click();
    await page.waitForSelector("text=External environment:");
    await page.getByRole("button", { name: "Skip this mission" }).click();
    await page.waitForSelector(".chip:has-text('Skipped')");
    await noOverflow(page, "outline mission");
  });

  await step("no script errors", async () => { assert.deepEqual(errors, []); });
  await ctx.close();
}

await browser.close();
server.close();
const failed = results.filter(r => r[0] === "FAIL");
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
