// Focused validators for the two contracts in handoff/schemas. They check the
// type, required-field, enum and pattern constraints the app relies on, then the
// reference checks a JSON Schema cannot express. They return a list of problems
// instead of throwing, so the caller can show them and leave current work untouched.

import { isPlainObject } from "./util.js";

const EVIDENCE_STATES = ["seen", "attempted", "self_checked", "reviewed", "applied"];
const EVENT_TYPES = ["opened", "submitted", "rubric_recorded", "feedback_responded", "transfer_checked",
  "hint_revealed", "model_answer_revealed", "feedback_imported", "skipped", "guided_practice_started"];
const EVIDENCE_KINDS = ["fictional", "simulated", "live"];
const RUBRIC_RESULTS = ["met", "needs_work", "uncertain"];
const REVIEW_RESULTS = ["demonstrated", "needs_revision", "not_assessable"];
const PROVENANCE = ["authored_choice_key", "self_review", "external_ai_unverified", "human_review"];
const MEASURE_KINDS = ["observed", "estimated", "fictional"];
const FIELD_KINDS = ["short_text", "long_text", "multi_select"];

export const ENUMS = { EVIDENCE_STATES, EVENT_TYPES, EVIDENCE_KINDS, RUBRIC_RESULTS, REVIEW_RESULTS, PROVENANCE, MEASURE_KINDS };

function checker() {
  const problems = [];
  const at = (path, msg) => problems.push(`${path}: ${msg}`);
  const str = (v, path, { min = 0, pattern } = {}) => {
    if (typeof v !== "string") return at(path, "must be text"), false;
    if (v.length < min) return at(path, "must not be empty"), false;
    if (pattern && !pattern.test(v)) return at(path, `does not match ${pattern}`), false;
    return true;
  };
  const int = (v, path, min) => {
    if (!Number.isInteger(v)) return at(path, "must be a whole number"), false;
    if (min !== undefined && v < min) return at(path, `must be at least ${min}`), false;
    return true;
  };
  const num = (v, path, min) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return at(path, "must be a number"), false;
    if (min !== undefined && v < min) return at(path, `must be at least ${min}`), false;
    return true;
  };
  const oneOf = (v, list, path) => {
    if (!list.includes(v)) return at(path, `must be one of ${list.join(", ")}`), false;
    return true;
  };
  const obj = (v, path, required = []) => {
    if (!isPlainObject(v)) return at(path, "must be an object"), false;
    for (const k of required) if (!(k in v)) at(path, `missing required "${k}"`);
    return true;
  };
  const arr = (v, path, min = 0) => {
    if (!Array.isArray(v)) return at(path, "must be a list"), false;
    if (v.length < min) return at(path, `must contain at least ${min} item(s)`), false;
    return true;
  };
  const date = (v, path, nullable = false) => {
    if (nullable && v === null) return true;
    if (typeof v !== "string" || Number.isNaN(Date.parse(v)) || !/^\d{4}-\d{2}-\d{2}T/.test(v)) return at(path, "must be an ISO date-time"), false;
    return true;
  };
  return { problems, at, str, int, num, oneOf, obj, arr, date };
}

export function validateLessonBundle(bundle, label = "bundle") {
  const c = checker();
  if (!c.obj(bundle, label, ["schemaVersion", "lessons"])) return c.problems;
  if (bundle.schemaVersion !== 1) c.at(`${label}.schemaVersion`, "unsupported content schema version");
  if (!c.arr(bundle.lessons, `${label}.lessons`, 1)) return c.problems;
  const required = ["id", "missionId", "moduleId", "contentVersion", "title", "estimatedMinutes", "objective", "scenario", "task", "hints", "rubric", "modelAnswer", "reflection", "nextDrill", "sources"];
  bundle.lessons.forEach((l, i) => {
    const p = `${label}.lessons[${i}]`;
    if (!c.obj(l, p, required)) return;
    c.str(l.id, `${p}.id`, { pattern: /^L[0-9]{2,}$/ });
    c.str(l.missionId, `${p}.missionId`, { pattern: /^M[0-9]{2}-[0-9]{2}$/ });
    c.str(l.moduleId, `${p}.moduleId`, { pattern: /^M[0-9]{2}$/ });
    c.int(l.contentVersion, `${p}.contentVersion`, 1);
    c.str(l.title, `${p}.title`, { min: 1 });
    c.int(l.estimatedMinutes, `${p}.estimatedMinutes`, 1);
    c.str(l.objective, `${p}.objective`, { min: 1 });
    if (c.obj(l.scenario, `${p}.scenario`, ["label", "facts", "inputText"])) {
      c.str(l.scenario.label, `${p}.scenario.label`);
      if (c.arr(l.scenario.facts, `${p}.scenario.facts`)) l.scenario.facts.forEach((f, j) => c.str(f, `${p}.scenario.facts[${j}]`));
      c.str(l.scenario.inputText, `${p}.scenario.inputText`);
      if ("flawedOutput" in l.scenario) c.str(l.scenario.flawedOutput, `${p}.scenario.flawedOutput`);
    }
    if (c.obj(l.task, `${p}.task`, ["instruction", "fields"])) {
      c.str(l.task.instruction, `${p}.task.instruction`);
      const ids = new Set();
      if (c.arr(l.task.fields, `${p}.task.fields`)) l.task.fields.forEach((f, j) => {
        const fp = `${p}.task.fields[${j}]`;
        if (!c.obj(f, fp, ["id", "label", "kind"])) return;
        c.str(f.id, `${fp}.id`, { min: 1 });
        if (ids.has(f.id)) c.at(`${fp}.id`, "duplicate field id");
        ids.add(f.id);
        c.str(f.label, `${fp}.label`);
        c.oneOf(f.kind, FIELD_KINDS, `${fp}.kind`);
        if (f.kind === "multi_select") {
          if (c.arr(f.options, `${fp}.options`, 1)) f.options.forEach((o, k) => {
            if (!c.obj(o, `${fp}.options[${k}]`, ["id", "label"])) return;
            c.str(o.id, `${fp}.options[${k}].id`, { min: 1 });
            c.str(o.label, `${fp}.options[${k}].label`);
            if ("correct" in o && typeof o.correct !== "boolean") c.at(`${fp}.options[${k}].correct`, "must be true or false");
          });
        }
      });
    }
    if (c.arr(l.hints, `${p}.hints`)) l.hints.forEach((t, j) => c.str(t, `${p}.hints[${j}]`));
    if (c.arr(l.rubric, `${p}.rubric`, 1)) {
      const rid = new Set();
      l.rubric.forEach((r, j) => {
        const rp = `${p}.rubric[${j}]`;
        if (!c.obj(r, rp, ["id", "label", "passEvidence", "errorTag"])) return;
        c.str(r.id, `${rp}.id`, { min: 1 });
        if (rid.has(r.id)) c.at(`${rp}.id`, "duplicate rubric id");
        rid.add(r.id);
        c.str(r.label, `${rp}.label`);
        c.str(r.passEvidence, `${rp}.passEvidence`);
        c.str(r.errorTag, `${rp}.errorTag`);
      });
    }
    c.str(l.modelAnswer, `${p}.modelAnswer`);
    c.str(l.reflection, `${p}.reflection`);
    if (c.obj(l.nextDrill, `${p}.nextDrill`, ["title", "instruction"])) {
      c.str(l.nextDrill.title, `${p}.nextDrill.title`);
      c.str(l.nextDrill.instruction, `${p}.nextDrill.instruction`);
    }
    if (c.arr(l.sources, `${p}.sources`)) l.sources.forEach((s, j) => c.obj(s, `${p}.sources[${j}]`, ["id", "label"]));
  });
  return c.problems;
}

// Shape validation of a portable progress file (schemas/progress.schema.json).
export function validateProgressShape(data) {
  const c = checker();
  if (!c.obj(data, "file", ["schemaVersion", "exportedAt", "profile", "drafts", "attempts", "notes", "measurements"])) return c.problems;
  if (data.schemaVersion !== 1) {
    c.at("file.schemaVersion", `unsupported progress schema version ${JSON.stringify(data.schemaVersion)}; this app reads version 1`);
    return c.problems;
  }
  c.date(data.exportedAt, "file.exportedAt");
  if (c.obj(data.profile, "profile", ["profileId", "preferredLanguage", "weeklyHours"])) {
    c.str(data.profile.profileId, "profile.profileId");
    c.str(data.profile.preferredLanguage, "profile.preferredLanguage");
    if (c.arr(data.profile.weeklyHours, "profile.weeklyHours", 2)) {
      if (data.profile.weeklyHours.length !== 2) c.at("profile.weeklyHours", "must contain exactly two numbers");
      data.profile.weeklyHours.forEach((n, i) => c.num(n, `profile.weeklyHours[${i}]`, 0));
    }
  }
  if (c.arr(data.drafts, "drafts")) data.drafts.forEach((d, i) => {
    const p = `drafts[${i}]`;
    if (!c.obj(d, p, ["id", "lessonId", "contentVersion", "updatedAt", "values"])) return;
    c.str(d.id, `${p}.id`, { min: 1 });
    c.str(d.lessonId, `${p}.lessonId`, { min: 1 });
    c.int(d.contentVersion, `${p}.contentVersion`, 1);
    c.date(d.updatedAt, `${p}.updatedAt`);
    c.obj(d.values, `${p}.values`);
  });
  if (c.arr(data.attempts, "attempts")) data.attempts.forEach((a, i) => validateAttempt(c, a, `attempts[${i}]`));
  if (c.arr(data.notes, "notes")) data.notes.forEach((n, i) => {
    const p = `notes[${i}]`;
    if (!c.obj(n, p, ["id", "text", "updatedAt"])) return;
    c.str(n.id, `${p}.id`, { min: 1 });
    c.str(n.text, `${p}.text`);
    c.date(n.updatedAt, `${p}.updatedAt`);
  });
  if (c.arr(data.measurements, "measurements")) data.measurements.forEach((m, i) => {
    const p = `measurements[${i}]`;
    if (!c.obj(m, p, ["id", "label", "kind", "unit", "value", "period"])) return;
    c.str(m.id, `${p}.id`, { min: 1 });
    c.str(m.label, `${p}.label`);
    c.oneOf(m.kind, MEASURE_KINDS, `${p}.kind`);
    c.str(m.unit, `${p}.unit`);
    c.num(m.value, `${p}.value`);
    c.str(m.period, `${p}.period`);
  });
  return c.problems;
}

function validateAttempt(c, a, p) {
  const required = ["id", "lessonId", "missionId", "contentVersion", "revisionId", "supersedesRevisionId", "state", "evidenceKind", "submittedAt", "submission", "rubricChecks", "feedback", "events"];
  if (!c.obj(a, p, required)) return;
  c.str(a.id, `${p}.id`, { min: 1 });
  c.str(a.lessonId, `${p}.lessonId`, { min: 1 });
  c.str(a.missionId, `${p}.missionId`, { min: 1 });
  c.int(a.contentVersion, `${p}.contentVersion`, 1);
  c.str(a.revisionId, `${p}.revisionId`, { min: 1 });
  if (a.supersedesRevisionId !== null) c.str(a.supersedesRevisionId, `${p}.supersedesRevisionId`);
  c.oneOf(a.state, EVIDENCE_STATES, `${p}.state`);
  c.oneOf(a.evidenceKind, EVIDENCE_KINDS, `${p}.evidenceKind`);
  c.date(a.submittedAt, `${p}.submittedAt`, true);
  c.obj(a.submission, `${p}.submission`);
  if (c.arr(a.rubricChecks, `${p}.rubricChecks`)) a.rubricChecks.forEach((r, i) => {
    const rp = `${p}.rubricChecks[${i}]`;
    if (!c.obj(r, rp, ["criterionId", "result", "evidenceText", "revisionId"])) return;
    c.str(r.criterionId, `${rp}.criterionId`);
    c.oneOf(r.result, RUBRIC_RESULTS, `${rp}.result`);
    c.str(r.evidenceText, `${rp}.evidenceText`);
    c.str(r.revisionId, `${rp}.revisionId`);
  });
  if (c.arr(a.feedback, `${p}.feedback`)) a.feedback.forEach((f, i) => {
    const fp = `${p}.feedback[${i}]`;
    if (!c.obj(f, fp, ["id", "revisionId", "provenance", "text", "learnerResponse"])) return;
    c.str(f.id, `${fp}.id`, { min: 1 });
    c.str(f.revisionId, `${fp}.revisionId`);
    c.oneOf(f.provenance, PROVENANCE, `${fp}.provenance`);
    c.str(f.text, `${fp}.text`);
    if (f.learnerResponse !== null) c.str(f.learnerResponse, `${fp}.learnerResponse`);
    if ("criterionReviews" in f && c.arr(f.criterionReviews, `${fp}.criterionReviews`)) f.criterionReviews.forEach((r, j) => {
      const cp = `${fp}.criterionReviews[${j}]`;
      if (!c.obj(r, cp, ["criterionId", "result", "evidenceText"])) return;
      c.str(r.criterionId, `${cp}.criterionId`);
      c.oneOf(r.result, REVIEW_RESULTS, `${cp}.result`);
      c.str(r.evidenceText, `${cp}.evidenceText`);
    });
  });
  if (c.arr(a.events, `${p}.events`)) a.events.forEach((e, i) => {
    const ep = `${p}.events[${i}]`;
    if (!c.obj(e, ep, ["id", "type", "createdAt", "revisionId", "evidence"])) return;
    c.str(e.id, `${ep}.id`, { min: 1 });
    c.oneOf(e.type, EVENT_TYPES, `${ep}.type`);
    c.date(e.createdAt, `${ep}.createdAt`);
    c.str(e.revisionId, `${ep}.revisionId`);
    c.obj(e.evidence, `${ep}.evidence`);
  });
}

// Reference checks that a schema cannot express. Problems here make a record
// unusable as evidence; warnings are shown but do not block an import.
export function checkProgressReferences(data) {
  const problems = [];
  const warnings = [];
  const ids = new Map();
  const seen = (kind, id) => {
    const key = `${kind}:${id}`;
    if (ids.has(key)) problems.push(`${kind} id "${id}" appears more than once in the file`);
    ids.set(key, true);
  };
  data.drafts.forEach(d => seen("draft", d.id));
  data.notes.forEach(n => seen("note", n.id));
  data.measurements.forEach(m => seen("measurement", m.id));
  const revisions = new Set();
  data.attempts.forEach(a => {
    seen("attempt", a.id);
    if (revisions.has(a.revisionId)) problems.push(`revision "${a.revisionId}" is used by more than one attempt`);
    revisions.add(a.revisionId);
  });
  data.attempts.forEach(a => {
    a.rubricChecks.forEach(r => { if (r.revisionId !== a.revisionId) problems.push(`attempt "${a.id}": a rubric check belongs to revision "${r.revisionId}", not "${a.revisionId}"`); });
    a.feedback.forEach(f => { if (f.revisionId !== a.revisionId) problems.push(`attempt "${a.id}": feedback "${f.id}" belongs to revision "${f.revisionId}", not "${a.revisionId}"`); });
    a.events.forEach(e => { if (e.revisionId !== a.revisionId) problems.push(`attempt "${a.id}": event "${e.id}" belongs to revision "${e.revisionId}", not "${a.revisionId}"`); });
    if (a.supersedesRevisionId && !revisions.has(a.supersedesRevisionId)) warnings.push(`attempt "${a.id}" supersedes revision "${a.supersedesRevisionId}", which is not in this file`);
  });
  return { problems, warnings };
}
