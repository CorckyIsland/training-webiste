// Run with: node --test tests/
// Focused checks for save/resume, failed writes, export/import round trips and
// conflicts, state transitions, and content-version preservation.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { buildContent } from "../js/content.js";
import * as M from "../js/model.js";
import { deriveRevision, lessonStatus } from "../js/evidence.js";
import { createStore } from "../js/store.js";
import { buildBackup, parseImport, planImport, applyImport, buildMarkdown } from "../js/backup.js";
import { buildReviewPacket, parseCriterionLines } from "../js/packet.js";
import { clone } from "../js/util.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = p => JSON.parse(readFileSync(join(root, p), "utf8"));
const starter = read("content/starter-lessons.json");
const applied = read("content/applied-lessons.json");
const base = { curriculum: read("content/curriculum.json"), notes: read("content/curriculum-notes.json"), diagnostic: read("content/diagnostic-map.json") };
const content = buildContent({ ...base, bundles: [{ name: "starter", data: starter }, { name: "applied", data: applied }] });
const L01 = content.lessons.get("L01");
const L02 = content.lessons.get("L02");

function fakeStorage() {
  const map = new Map();
  return {
    map, failNext: false, blocked: false, corruptNext: false,
    getItem(k) { if (this.blocked) throw new Error("SecurityError"); return map.has(k) ? map.get(k) : null; },
    setItem(k, v) {
      if (this.blocked) throw new Error("SecurityError");
      if (this.failNext) { this.failNext = false; const e = new Error("quota exceeded"); e.name = "QuotaExceededError"; throw e; }
      if (this.corruptNext) { this.corruptNext = false; map.set(k, v.slice(0, 10)); return; }
      map.set(k, v);
    },
    removeItem(k) { map.delete(k); }
  };
}

function fullLoop(p, lesson) {
  M.openLesson(p, lesson);
  M.setPreAttempt(p, lesson, { confidence: 4, predictedDifficulty: "Rewriting within 110 words" });
  M.setDraftValue(p, lesson, "unsafe_claims", ["booking_confirmed", "price_confirmed"]);
  M.setDraftValue(p, lesson, "revised_reply", "Hi Lea, we will check availability. Not yet confirmed.");
  const sub = M.submitAttempt(p, lesson);
  assert.ok(sub.ok);
  return sub.attempt;
}

test("content: 6 lessons map to the specified missions; 22 missions remain outlines", () => {
  assert.deepEqual(content.problems, []);
  const map = Object.fromEntries([...content.lessons.values()].map(l => [l.id, l.missionId]));
  assert.deepEqual(map, { L01: "M00-01", L02: "M01-01", L03: "M02-02", L04: "M02-03", L05: "M03-04", L06: "M05-02" });
  assert.equal(content.missionOrder.length, 28);
  assert.equal(content.missionOrder.filter(id => !content.lessonByMission.has(id)).length, 22);
  assert.equal(content.briefs.length, 5);
  assert.ok(content.briefs.every(b => !content.lessons.has(b.id)), "CP briefs are not lesson IDs");
});

test("content: a duplicate lesson ID in a later bundle is rejected and the original kept", () => {
  const dup = clone(applied);
  dup.lessons[0] = { ...clone(starter.lessons[0]), title: "Impostor", contentVersion: 9 };
  const c = buildContent({ ...base, bundles: [{ name: "starter", data: starter }, { name: "dup", data: dup }] });
  assert.equal(c.lessons.get("L01").title, L01.title);
  assert.equal(c.lessons.get("L01").contentVersion, 1);
  assert.ok(c.problems.some(p => p.includes("L01") && p.includes("rejected")));
});

test("content: an invalid bundle is skipped as a whole", () => {
  const bad = clone(applied);
  delete bad.lessons[1].rubric;
  const c = buildContent({ ...base, bundles: [{ name: "starter", data: starter }, { name: "bad", data: bad }] });
  assert.equal(c.lessons.size, 3);
  assert.ok(c.problems[0].startsWith("bad was not loaded"));
});

test("states: opening gives seen only; assistance never advances state", () => {
  const p = M.blankProgress();
  M.openLesson(p, L01);
  M.openLesson(p, L01);
  assert.equal(p.attempts.length, 1);
  M.revealHint(p, L01, 0);
  M.revealHint(p, L01, 1);
  M.revealModelAnswer(p, L01);
  const a = p.attempts[0];
  assert.equal(deriveRevision(a, L01).state, "seen");
  assert.equal(a.events.filter(e => e.type === "opened").length, 1);
});

test("states: full loop seen → attempted → self_checked → reviewed → applied", () => {
  const p = M.blankProgress();
  const a = fullLoop(p, L01);
  assert.equal(deriveRevision(a, L01).state, "attempted");
  assert.equal(a.feedback[0].provenance, "authored_choice_key");
  assert.match(a.feedback[0].text, /selections only/);

  const partial = { "L01-R1": { result: "met", evidenceText: "Left unconfirmed." } };
  assert.equal(M.recordRubric(p, L01, a, partial).ok, false, "incomplete rubric is refused");
  const all = Object.fromEntries(L01.rubric.map(r => [r.id, { result: "needs_work", evidenceText: "" }]));
  assert.equal(M.recordRubric(p, L01, a, all).ok, false, "a rubric check needs at least one note");
  all["L01-R1"].evidenceText = "Reply says the booking is not confirmed.";
  assert.ok(M.recordRubric(p, L01, a, all).ok);
  assert.equal(deriveRevision(a, L01).state, "self_checked");

  // Pasting feedback is not a response.
  const ext = M.addFeedback(p, L01, a, { provenance: "external_ai_unverified", text: "L01-R1 | demonstrated | ok" });
  assert.ok(ext.ok);
  assert.equal(deriveRevision(a, L01).state, "self_checked");
  assert.equal(M.respondToFeedback(p, L01, a, ext.feedback.id, { decision: "accept", text: "" }).ok, false);
  assert.ok(M.respondToFeedback(p, L01, a, ext.feedback.id, { decision: "accept", text: "I agree; I will keep the wheelchair requirement." }).ok);
  assert.equal(ext.feedback.provenance, "external_ai_unverified", "provenance survives the response");
  assert.equal(deriveRevision(a, L01).state, "reviewed");

  // A remedial drill does not establish applied.
  assert.ok(M.recordDrill(p, L01, a, { drillId: "D-REQUIREMENTS", errorTag: "IGNORED_REQUIREMENT", trigger: "rubric", response: "Checklist…", result: "met", note: "" }).ok);
  assert.equal(deriveRevision(a, L01).state, "reviewed");
  assert.equal(M.submitTransfer(p, L01, a, { text: "Two sentences", evidenceKind: "fictional", result: "met", evidenceText: "" }).ok, false);
  assert.ok(M.submitTransfer(p, L01, a, { text: "Two sentences", evidenceKind: "fictional", result: "met", evidenceText: "Compared with the verified facts" }).ok);
  assert.equal(deriveRevision(a, L01).state, "applied");
});

test("states: a model answer seen before submission marks guided practice", () => {
  const p = M.blankProgress();
  M.openLesson(p, L02);
  M.revealModelAnswer(p, L02);
  M.setDraftValue(p, L02, "problem_hypothesis", "Owner and office…");
  const a = M.submitAttempt(p, L02).attempt;
  const info = deriveRevision(a, L02);
  assert.equal(info.state, "attempted");
  assert.equal(info.guided, true);
});

test("revisions: resubmitting creates a new revision; old checks stay with the old one", () => {
  const p = M.blankProgress();
  const a1 = fullLoop(p, L01);
  const all = Object.fromEntries(L01.rubric.map(r => [r.id, { result: "met", evidenceText: "note" }]));
  M.recordRubric(p, L01, a1, all);
  const w = M.startRevision(p, L01);
  assert.equal(w.supersedesRevisionId, a1.revisionId);
  M.setDraftValue(p, L01, "revised_reply", "A better reply");
  const a2 = M.submitAttempt(p, L01).attempt;
  assert.notEqual(a2.revisionId, a1.revisionId);
  assert.equal(deriveRevision(a2, L01).state, "attempted");
  assert.equal(deriveRevision(a1, L01).state, "self_checked");
  assert.equal(a1.submission.revised_reply, "Hi Lea, we will check availability. Not yet confirmed.", "submitted snapshot is immutable");
  assert.equal(a2.rubricChecks.length, 0);
  const st = lessonStatus(p, L01);
  assert.equal(st.active.id, a2.id);
  assert.equal(st.revisionCount, 2);
});

test("states: imported labels are not trusted", () => {
  const p = M.blankProgress();
  const a = fullLoop(p, L01);
  a.state = "applied";
  assert.equal(deriveRevision(a, L01).state, "attempted");
  // A feedback_responded event pointing at a missing response does not count.
  a.events.push({ id: "x", type: "feedback_responded", createdAt: new Date().toISOString(), revisionId: a.revisionId, evidence: { feedbackId: a.feedback[0].id } });
  assert.equal(deriveRevision(a, L01).state, "attempted");
});

test("store: save, reload and resume in the same browser", () => {
  const storage = fakeStorage();
  const s1 = createStore({ storage, debounceMs: 0 });
  s1.load();
  s1.update(p => { M.openLesson(p, L01); M.setDraftValue(p, L01, "revised_reply", "draft text"); }, { immediate: true });
  assert.equal(s1.status.kind, "saved");
  const s2 = createStore({ storage });
  s2.load();
  assert.equal(M.getDraft(s2.data, "L01").values.revised_reply, "draft text");
  assert.equal(s2.data.attempts.length, 1);
});

test("store: a failed write reports an error, never 'saved', and keeps the last confirmed copy", () => {
  const storage = fakeStorage();
  const s = createStore({ storage });
  s.load();
  s.update(p => M.setDraftValue(p, L01, "revised_reply", "first"), { immediate: true });
  const confirmed = storage.map.get("ai-business-practice:progress:v1");
  storage.failNext = true;
  s.update(p => M.setDraftValue(p, L01, "revised_reply", "second"), { immediate: true });
  assert.equal(s.status.kind, "error");
  assert.match(s.status.message, /Not saved/);
  assert.equal(storage.map.get("ai-business-practice:progress:v1"), confirmed);
  assert.equal(M.getDraft(s.data, "L01").values.revised_reply, "second", "unsaved change is kept in memory for export");
  s.saveNow();
  assert.equal(s.status.kind, "saved");
});

test("store: a write that reads back differently is not reported as saved", () => {
  const storage = fakeStorage();
  const s = createStore({ storage });
  s.load();
  s.update(p => M.setDraftValue(p, L01, "revised_reply", "ok"), { immediate: true });
  const confirmed = storage.map.get("ai-business-practice:progress:v1");
  storage.corruptNext = true;
  s.update(p => M.setDraftValue(p, L01, "revised_reply", "changed"), { immediate: true });
  assert.equal(s.status.kind, "error");
  assert.equal(storage.map.get("ai-business-practice:progress:v1"), confirmed, "partial write was rolled back");
});

test("store: blocked storage is reported", () => {
  const storage = fakeStorage();
  storage.blocked = true;
  const s = createStore({ storage });
  s.load();
  assert.equal(s.status.kind, "error");
  s.update(p => M.setDraftValue(p, L01, "revised_reply", "x"), { immediate: true });
  assert.equal(s.status.kind, "error");
});

test("store: unreadable saved data is never overwritten", () => {
  const storage = fakeStorage();
  storage.map.set("ai-business-practice:progress:v1", "{not json");
  const s = createStore({ storage });
  s.load();
  assert.equal(s.status.kind, "error");
  s.update(p => M.setDraftValue(p, L01, "revised_reply", "x"), { immediate: true });
  assert.equal(storage.map.get("ai-business-practice:progress:v1"), "{not json");
  assert.ok(s.setAsideUnreadable());
  assert.ok([...storage.map.keys()].some(k => k.includes("unreadable")));
  assert.equal(s.status.kind, "saved");
});

test("store: a newer save from another tab is not overwritten", () => {
  const storage = fakeStorage();
  const a = createStore({ storage }); a.load();
  a.update(p => M.setDraftValue(p, L01, "revised_reply", "tab A"), { immediate: true });
  const b = createStore({ storage }); b.load();
  b.update(p => M.setDraftValue(p, L01, "revised_reply", "tab B"), { immediate: true });
  a.update(p => M.setDraftValue(p, L01, "revised_reply", "tab A again"), { immediate: true });
  assert.equal(a.status.kind, "conflict");
  const c = createStore({ storage }); c.load();
  assert.equal(M.getDraft(c.data, "L01").values.revised_reply, "tab B");
});

test("backup: export → restore into an empty profile preserves every record", () => {
  const p = M.blankProgress();
  const a = fullLoop(p, L01);
  const all = Object.fromEntries(L01.rubric.map(r => [r.id, { result: "met", evidenceText: "n" }]));
  M.recordRubric(p, L01, a, all);
  M.respondToFeedback(p, L01, a, a.feedback[0].id, { decision: "amend", text: "I will add the suitability check." });
  M.upsertNote(p, { text: "general note" });
  M.addMeasurement(p, { label: "Handling", kind: "fictional", unit: "min", value: "12", period: "one case" });
  M.setDraftValue(p, L02, "problem_hypothesis", "draft");
  const backup = buildBackup(p, content);
  const parsed = parseImport(JSON.stringify(backup));
  assert.ok(parsed.ok, parsed.errors.join("; "));
  const empty = M.blankProgress();
  const plan = planImport(empty, parsed.data, content);
  assert.equal(plan.counts.conflict, 0);
  const res = applyImport(empty, parsed.data, plan, {}, content);
  assert.ok(res.ok);
  for (const k of ["drafts", "attempts", "notes", "measurements"]) assert.deepEqual(res.progress[k], backup[k], k);
  assert.equal(res.progress.attempts[0].state, "reviewed");
});

test("import: malformed, unsupported schema and broken references are rejected", () => {
  assert.equal(parseImport("{oops").ok, false);
  assert.equal(parseImport(JSON.stringify({ schemaVersion: 2 })).ok, false);
  const p = M.blankProgress();
  fullLoop(p, L01);
  const b = buildBackup(p, content);
  b.attempts[0].feedback[0].revisionId = "someone-else";
  const r = parseImport(JSON.stringify(b));
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /belongs to revision/);
});

test("import: conflicts require an explicit choice and default to nothing changed", () => {
  const local = M.blankProgress();
  M.upsertNote(local, { text: "local text" });
  const imported = clone(local);
  imported.notes[0].text = "imported text";
  imported.notes.push({ id: "n2", text: "new", updatedAt: new Date().toISOString() });
  const parsed = parseImport(JSON.stringify(buildBackup(imported, content)));
  const plan = planImport(local, parsed.data, content);
  assert.equal(plan.counts.conflict, 1);
  assert.equal(plan.counts.new, 1);
  const refused = applyImport(local, parsed.data, plan, {}, content);
  assert.equal(refused.ok, false);
  assert.equal(local.notes[0].text, "local text");
  const key = plan.items.find(i => i.status === "conflict").key;
  const keep = applyImport(local, parsed.data, plan, { [key]: "local" }, content);
  assert.equal(keep.progress.notes.find(n => n.id === local.notes[0].id).text, "local text");
  assert.equal(keep.progress.notes.length, 2);
  const use = applyImport(local, parsed.data, plan, { [key]: "imported" }, content);
  assert.equal(use.progress.notes.find(n => n.id === local.notes[0].id).text, "imported text");
});

test("import: the synthetic sample loads; unknown lessons are kept; inflated labels are corrected", () => {
  const sample = readFileSync(join(root, "handoff/samples/progress-example.json"), "utf8");
  const parsed = parseImport(sample);
  assert.ok(parsed.ok, parsed.errors.join("; "));
  assert.ok(parsed.warnings.some(w => /synthetic sample/.test(w)));
  const data = clone(parsed.data);
  data.attempts.push({ ...clone(data.attempts[1]), id: "arch-1", revisionId: "arch-rev", supersedesRevisionId: null, lessonId: "L99", missionId: "M09-09", feedback: [], events: [] });
  const plan = planImport(M.blankProgress(), data, content);
  assert.deepEqual(plan.unknownLessons, ["L99"]);
  // The sample's first revision has no rubric for... it does have all six checks and a response.
  const res = applyImport(M.blankProgress(), data, plan, {}, content);
  assert.ok(res.ok, res.error);
  assert.ok(res.progress.attempts.some(a => a.lessonId === "L99"), "unknown lesson kept as archived work");
  assert.equal(res.progress.attempts.find(a => a.id === "sample-attempt-L01-r1").state, "reviewed");
});

test("versions: a changed rubric keeps old work as history and refuses new checks on it", () => {
  const p = M.blankProgress();
  const a = fullLoop(p, L01);
  const v2 = { ...clone(L01), contentVersion: 2, rubric: clone(L01.rubric).slice(0, 3) };
  const all = Object.fromEntries(v2.rubric.map(r => [r.id, { result: "met", evidenceText: "n" }]));
  const res = M.recordRubric(p, v2, a, all);
  assert.equal(res.ok, false);
  assert.match(res.error, /earlier version/);
  const st = lessonStatus(p, v2);
  assert.equal(st.outdated, true);
  assert.equal(a.contentSnapshot.rubric.length, 6, "the original rubric stays readable");
  M.startRevision(p, v2, { blank: true });
  M.setDraftValue(p, v2, "revised_reply", "fresh");
  const a2 = M.submitAttempt(p, v2).attempt;
  assert.equal(a2.contentVersion, 2);
  assert.equal(p.attempts.length, 2);
});

test("packet and markdown contain exactly the shared work", () => {
  const p = M.blankProgress();
  const a = fullLoop(p, L01);
  const packet = buildReviewPacket(L01, a);
  assert.match(packet, /L01-R1 \| Booking authority/);
  assert.match(packet, /The booking is confirmed\./);
  assert.ok(!packet.includes("Rewriting within 110 words"), "confidence notes are not shared");
  const reviews = parseCriterionLines("L01-R1 | demonstrated | ok\n- **L01-R3** | needs_revision | wheelchair\nL01-R9 | demonstrated | unknown", L01);
  assert.deepEqual(reviews.map(r => [r.criterionId, r.result]), [["L01-R1", "demonstrated"], ["L01-R3", "needs_revision"]]);
  const md = buildMarkdown(p, content, { lessonIds: ["L01"] });
  assert.match(md, /Answer-key check \(selections only\)/);
  assert.match(md, /not a backup/);
});
