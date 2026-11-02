// Operations on the progress record. Each function changes the plain progress object
// passed in (the store hands over its working copy) and returns a result. Submitted
// work is never edited: changed work becomes a new revision.

import { newId, nowIso, clone, isBlank } from "./util.js";
import { workingAttempt, latestSubmitted, attemptsForLesson } from "./evidence.js";

export function blankProgress() {
  return {
    schemaVersion: 1,
    profile: { profileId: newId("profile"), preferredLanguage: "en", weeklyHours: [6, 8] },
    drafts: [],
    attempts: [],
    notes: [],
    measurements: [],
    missionEvents: []
  };
}

function event(attempt, type, evidence = {}) {
  const e = { id: newId("event"), type, createdAt: nowIso(), revisionId: attempt.revisionId, evidence };
  attempt.events.push(e);
  return e;
}

function newAttempt(lesson, supersedes) {
  const revisionId = newId("rev");
  return {
    id: newId(`attempt-${lesson.id}`),
    lessonId: lesson.id,
    missionId: lesson.missionId,
    contentVersion: lesson.contentVersion,
    revisionId,
    supersedesRevisionId: supersedes ? supersedes.revisionId : null,
    state: "seen",
    evidenceKind: "fictional",
    submittedAt: null,
    submission: {},
    rubricChecks: [],
    feedback: [],
    events: [],
    drills: []
  };
}

// ---- Drafts ---------------------------------------------------------------

export function getDraft(p, lessonId) {
  return p.drafts.filter(d => d.lessonId === lessonId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null;
}

export function ensureDraft(p, lesson) {
  let d = getDraft(p, lesson.id);
  if (!d) {
    d = { id: `draft-${lesson.id}`, lessonId: lesson.id, contentVersion: lesson.contentVersion, updatedAt: nowIso(), values: {}, preAttempt: {}, reviewDrafts: {} };
    if (p.drafts.some(x => x.id === d.id)) d.id = newId(`draft-${lesson.id}`);
    p.drafts.push(d);
  }
  if (!d.preAttempt) d.preAttempt = {};
  if (!d.reviewDrafts) d.reviewDrafts = {};
  return d;
}

export function setDraftValue(p, lesson, fieldId, value) {
  const d = ensureDraft(p, lesson);
  d.values[fieldId] = value;
  d.updatedAt = nowIso();
}

export function setPreAttempt(p, lesson, patch) {
  const d = ensureDraft(p, lesson);
  d.preAttempt = { ...d.preAttempt, ...patch };
  d.updatedAt = nowIso();
}

// Unsubmitted rubric, feedback-response, transfer and drill text for a revision.
export function setReviewDraft(p, lesson, revisionId, section, value) {
  const d = ensureDraft(p, lesson);
  d.reviewDrafts[revisionId] = { ...(d.reviewDrafts[revisionId] || {}), [section]: value };
  d.updatedAt = nowIso();
}

export function getReviewDraft(p, lessonId, revisionId, section) {
  const d = getDraft(p, lessonId);
  return d && d.reviewDrafts && d.reviewDrafts[revisionId] ? d.reviewDrafts[revisionId][section] : undefined;
}

// ---- Lesson lifecycle -------------------------------------------------------

// Opening a lesson records `seen` on a working revision only when the lesson has never
// been opened. Re-opening does not add events or change any state.
export function openLesson(p, lesson) {
  if (attemptsForLesson(p, lesson.id).length) {
    const w = workingAttempt(p, lesson.id);
    if (w && !w.events.some(e => e.type === "opened")) event(w, "opened", {});
    return { changed: !!w };
  }
  const a = newAttempt(lesson, null);
  event(a, "opened", {});
  p.attempts.push(a);
  return { changed: true };
}

// A new working revision supersedes the latest submitted one. `blank` starts the
// draft empty (repeat); otherwise the draft keeps the previous answer to revise.
export function startRevision(p, lesson, { blank = false } = {}) {
  let w = workingAttempt(p, lesson.id);
  if (!w) {
    w = newAttempt(lesson, latestSubmitted(p, lesson.id));
    event(w, "opened", { reason: blank ? "fresh_attempt" : "revision" });
    p.attempts.push(w);
  }
  const d = ensureDraft(p, lesson);
  if (blank) { d.values = {}; d.preAttempt = {}; }
  d.contentVersion = lesson.contentVersion;
  d.updatedAt = nowIso();
  return w;
}

// Skipping is a mission-level event, not an evidence state. It works for outlines
// too, never counts as passing, and is undone by "unskip".
export function markMission(p, missionId, type) {
  if (!["skipped", "unskipped"].includes(type)) return;
  if (!p.missionEvents) p.missionEvents = [];
  p.missionEvents.push({ id: newId("mission-event"), missionId, type, createdAt: nowIso() });
}

export function missionSkipped(p, missionId) {
  const list = (p.missionEvents || []).filter(e => e.missionId === missionId);
  return list.length > 0 && list[list.length - 1].type === "skipped";
}

function assistanceTarget(p, lesson) {
  return workingAttempt(p, lesson.id) || latestSubmitted(p, lesson.id);
}

export function revealHint(p, lesson, hintIndex) {
  const t = assistanceTarget(p, lesson);
  if (!t) return null;
  if (t.events.some(e => e.type === "hint_revealed" && e.evidence.hintIndex === hintIndex)) return t;
  event(t, "hint_revealed", { hintIndex });
  return t;
}

export function revealModelAnswer(p, lesson) {
  const t = assistanceTarget(p, lesson);
  if (!t) return null;
  if (!t.events.some(e => e.type === "model_answer_revealed")) {
    event(t, "model_answer_revealed", {});
    // Seeing the answer before submitting this revision makes it guided practice.
    if (!t.submittedAt) event(t, "guided_practice_started", { reason: "model_answer_revealed_before_submission" });
  }
  return t;
}

export function submittableValues(lesson, values) {
  const out = {};
  for (const f of lesson.task.fields) {
    const v = values ? values[f.id] : undefined;
    if (f.kind === "multi_select") out[f.id] = Array.isArray(v) ? v.filter(id => f.options.some(o => o.id === id)) : [];
    else out[f.id] = typeof v === "string" ? v : "";
  }
  return out;
}

export function emptyFields(lesson, values) {
  return lesson.task.fields.filter(f => isBlank(values[f.id])).map(f => f.label);
}

// Compares selections with the authored key. The result covers the selections only.
export function checkChoices(lesson, submission) {
  const results = [];
  for (const f of lesson.task.fields) {
    if (f.kind !== "multi_select" || !f.options.some(o => typeof o.correct === "boolean")) continue;
    const chosen = new Set(submission[f.id] || []);
    const missed = f.options.filter(o => o.correct === true && !chosen.has(o.id));
    const extra = f.options.filter(o => o.correct === false && chosen.has(o.id));
    const matched = f.options.filter(o => o.correct === true && chosen.has(o.id));
    results.push({ fieldId: f.id, fieldLabel: f.label, missed, extra, matched, total: f.options.filter(o => o.correct === true).length });
  }
  return results;
}

function choiceFeedbackText(r) {
  const lines = [];
  lines.push(`Answer-key check for “${r.fieldLabel}”. You selected ${r.matched.length} of ${r.total} keyed claims.`);
  for (const o of r.missed) lines.push(`Not selected: “${o.label}” — the case does not establish this, so it cannot be sent as fact.`);
  for (const o of r.extra) lines.push(`Selected but supplied by the case: “${o.label}” — compare it with the enquiry and facts.`);
  if (!r.missed.length && !r.extra.length) lines.push("Your selections match the key.");
  lines.push("This check covers the selections only. Your written reply and explanation are not assessed by it.");
  return lines.join("\n");
}

export function submitAttempt(p, lesson) {
  const d = ensureDraft(p, lesson);
  const submission = submittableValues(lesson, d.values);
  if (!Object.values(submission).some(v => !isBlank(v))) return { ok: false, error: "There is nothing to submit yet. Write or select something first." };
  let a = workingAttempt(p, lesson.id);
  const previous = latestSubmitted(p, lesson.id);
  if (!a) { a = newAttempt(lesson, previous); p.attempts.push(a); }
  a.contentVersion = lesson.contentVersion;
  a.supersedesRevisionId = previous ? previous.revisionId : null;
  a.submission = submission;
  a.submittedAt = nowIso();
  a.preAttempt = clone(d.preAttempt || {});
  a.contentSnapshot = {
    title: lesson.title,
    fields: lesson.task.fields.map(f => ({ id: f.id, label: f.label, kind: f.kind, options: f.options ? f.options.map(o => ({ id: o.id, label: o.label })) : undefined })),
    rubric: lesson.rubric.map(r => ({ id: r.id, label: r.label, passEvidence: r.passEvidence, critical: !!r.critical }))
  };
  event(a, "submitted", { submissionId: a.id, supersedesRevisionId: a.supersedesRevisionId });
  for (const r of checkChoices(lesson, submission)) {
    a.feedback.push({
      id: newId("feedback-key"),
      revisionId: a.revisionId,
      provenance: "authored_choice_key",
      text: choiceFeedbackText(r),
      learnerResponse: null,
      createdAt: nowIso(),
      choiceCheck: { fieldId: r.fieldId, missed: r.missed.map(o => o.id), extra: r.extra.map(o => o.id), matched: r.matched.map(o => o.id) }
    });
  }
  a.state = "attempted";
  return { ok: true, attempt: a };
}

// ---- Review steps on a submitted revision ----------------------------------

function requireCurrent(attempt, lesson) {
  if (!attempt || !attempt.submittedAt) return "Submit an attempt first; checks always belong to a specific submitted revision.";
  if (attempt.contentVersion !== lesson.contentVersion) return "This revision was written for an earlier version of the exercise. It stays in your history; start a fresh attempt to record new checks.";
  return null;
}

export function recordRubric(p, lesson, attempt, entries) {
  const err = requireCurrent(attempt, lesson);
  if (err) return { ok: false, error: err };
  const checks = [];
  for (const r of lesson.rubric) {
    const e = entries[r.id] || {};
    if (!["met", "needs_work", "uncertain"].includes(e.result)) return { ok: false, error: `Choose a result for “${r.label}”.` };
    checks.push({ criterionId: r.id, result: e.result, evidenceText: String(e.evidenceText || "").trim(), revisionId: attempt.revisionId });
  }
  if (!checks.some(c => c.evidenceText)) return { ok: false, error: "Add at least one note pointing to evidence in your attempt." };
  attempt.rubricChecks = checks;
  event(attempt, "rubric_recorded", { criterionIds: checks.map(c => c.criterionId), checks: clone(checks) });
  return { ok: true };
}

export function addFeedback(p, lesson, attempt, { provenance, text, criterionReviews, sourceLabel }) {
  const err = requireCurrent(attempt, lesson);
  if (err) return { ok: false, error: err };
  if (!["self_review", "external_ai_unverified", "human_review"].includes(provenance)) return { ok: false, error: "Unknown feedback source." };
  if (isBlank(text)) return { ok: false, error: "Feedback text is empty." };
  const fb = { id: newId("feedback"), revisionId: attempt.revisionId, provenance, text: String(text), learnerResponse: null, createdAt: nowIso() };
  if (sourceLabel) fb.sourceLabel = String(sourceLabel).slice(0, 120);
  if (criterionReviews && criterionReviews.length) fb.criterionReviews = criterionReviews;
  attempt.feedback.push(fb);
  event(attempt, "feedback_imported", { feedbackId: fb.id, provenance });
  return { ok: true, feedback: fb };
}

// The learner's response is a separate event. It never changes the feedback's origin.
export function respondToFeedback(p, lesson, attempt, feedbackId, { decision, text }) {
  const err = requireCurrent(attempt, lesson);
  if (err) return { ok: false, error: err };
  const fb = attempt.feedback.find(f => f.id === feedbackId);
  if (!fb) return { ok: false, error: "That feedback item was not found on this revision." };
  if (!["accept", "reject", "amend"].includes(decision)) return { ok: false, error: "Choose accept, reject or amend." };
  if (isBlank(text)) return { ok: false, error: "Write a short response: what you will do, or why you disagree." };
  fb.learnerResponse = String(text).trim();
  fb.responseDecision = decision;
  fb.respondedAt = nowIso();
  event(attempt, "feedback_responded", { feedbackId, decision, response: fb.learnerResponse });
  return { ok: true };
}

export function recordDrill(p, lesson, attempt, { drillId, errorTag, trigger, response, result, note }) {
  if (!attempt || !attempt.submittedAt) return { ok: false, error: "Submit an attempt first." };
  if (isBlank(response)) return { ok: false, error: "Write your drill answer first." };
  if (!["met", "needs_work", "uncertain"].includes(result)) return { ok: false, error: "Record how your answer compares with the drill’s self-check." };
  if (!attempt.drills) attempt.drills = [];
  attempt.drills.push({ id: newId("drill"), drillId, errorTag, trigger, response: String(response), selfCheck: { result, note: String(note || "") }, createdAt: nowIso() });
  return { ok: true };
}

export function submitTransfer(p, lesson, attempt, { text, evidenceKind, result, evidenceText }) {
  const err = requireCurrent(attempt, lesson);
  if (err) return { ok: false, error: err };
  if (isBlank(text)) return { ok: false, error: "Write your transfer attempt first." };
  if (!["fictional", "simulated", "live"].includes(evidenceKind)) return { ok: false, error: "Label the transfer as fictional, simulated or live." };
  if (!["met", "needs_work", "uncertain"].includes(result)) return { ok: false, error: "Record the check of your transfer attempt." };
  if (isBlank(evidenceText)) return { ok: false, error: "Note what you compared the transfer attempt against." };
  event(attempt, "transfer_checked", {
    transferId: newId("transfer"),
    title: lesson.nextDrill.title,
    transferSubmission: String(text),
    evidenceKind,
    transferCheck: { result, evidenceText: String(evidenceText) },
    submittedAt: nowIso()
  });
  return { ok: true };
}

// ---- Notes and measurements -------------------------------------------------

export function upsertNote(p, { id, text, lessonId, missionId, kind }) {
  let n = id ? p.notes.find(x => x.id === id) : null;
  if (!n && kind === "reflection" && lessonId) n = p.notes.find(x => x.kind === "reflection" && x.lessonId === lessonId);
  if (!n && kind === "mission" && missionId) n = p.notes.find(x => x.kind === "mission" && x.missionId === missionId);
  if (!n) {
    n = { id: newId("note"), text: "", updatedAt: nowIso() };
    if (lessonId) n.lessonId = lessonId;
    if (missionId) n.missionId = missionId;
    if (kind) n.kind = kind;
    p.notes.push(n);
  }
  n.text = String(text);
  n.updatedAt = nowIso();
  return n;
}

export function deleteNote(p, id) {
  p.notes = p.notes.filter(n => n.id !== id);
}

export function addMeasurement(p, { label, kind, unit, value, period }) {
  if (isBlank(label) || isBlank(unit) || isBlank(period)) return { ok: false, error: "Fill in label, unit and period." };
  const num = Number(value);
  if (!Number.isFinite(num)) return { ok: false, error: "The value must be a number." };
  if (!["observed", "estimated", "fictional"].includes(kind)) return { ok: false, error: "Choose observed, estimated or fictional." };
  p.measurements.push({ id: newId("measure"), label: String(label), kind, unit: String(unit), value: num, period: String(period), createdAt: nowIso() });
  return { ok: true };
}

export function deleteMeasurement(p, id) {
  p.measurements = p.measurements.filter(m => m.id !== id);
}
