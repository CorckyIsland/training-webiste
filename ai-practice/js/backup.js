// Export, readable Markdown export and safe import. Import never changes anything by
// itself: parse → validate → plan (what is new, identical, conflicting) → the learner
// decides each conflict → apply. Imported state labels are recomputed from evidence.

import { validateProgressShape, checkProgressReferences } from "./validate.js";
import { deriveRevision, STATE_INFO } from "./evidence.js";
import { clone, deepEqual, nowIso, formatTime } from "./util.js";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const COLLECTIONS = ["drafts", "attempts", "notes", "measurements", "missionEvents"];

export function recomputeStates(progress, content) {
  for (const a of progress.attempts) {
    const lesson = content.lessons.get(a.lessonId);
    const usable = lesson && lesson.contentVersion === a.contentVersion ? lesson : null;
    a.state = deriveRevision(a, usable).state || "seen";
  }
  return progress;
}

export function buildBackup(progress, content, at = nowIso()) {
  const out = clone(progress);
  if (!out.missionEvents) out.missionEvents = [];
  recomputeStates(out, content);
  return {
    schemaVersion: 1,
    exportedAt: at,
    app: { name: "AI Business Practice", kind: "full-backup", note: "A backup of data saved in one browser. It is not cloud sync." },
    profile: out.profile,
    drafts: out.drafts,
    attempts: out.attempts,
    notes: out.notes,
    measurements: out.measurements,
    missionEvents: out.missionEvents
  };
}

export function summarise(progress) {
  const attempts = progress.attempts || [];
  const submitted = attempts.filter(a => a.submittedAt);
  const feedback = attempts.flatMap(a => a.feedback || []);
  const byProv = {};
  for (const f of feedback) byProv[f.provenance] = (byProv[f.provenance] || 0) + 1;
  const versions = {};
  for (const a of attempts) versions[`${a.lessonId} v${a.contentVersion}`] = true;
  return {
    drafts: (progress.drafts || []).length,
    revisions: submitted.length,
    openedOnly: attempts.length - submitted.length,
    events: attempts.reduce((n, a) => n + (a.events || []).length, 0),
    rubricChecks: attempts.reduce((n, a) => n + (a.rubricChecks || []).length, 0),
    feedback: feedback.length,
    feedbackByProvenance: byProv,
    transfers: attempts.reduce((n, a) => n + (a.events || []).filter(e => e.type === "transfer_checked").length, 0),
    drills: attempts.reduce((n, a) => n + (a.drills || []).length, 0),
    notes: (progress.notes || []).length,
    measurements: (progress.measurements || []).length,
    contentVersions: Object.keys(versions).sort()
  };
}

// ---- Readable Markdown ---------------------------------------------------------

const PROVENANCE_LABEL = {
  authored_choice_key: "Answer-key check (selections only)",
  self_review: "Self-review",
  external_ai_unverified: "External AI review — unverified",
  human_review: "Review from a person"
};
export { PROVENANCE_LABEL };

const RESULT_LABEL = { met: "Met", needs_work: "Needs work", uncertain: "Uncertain" };
const REVIEW_LABEL = { demonstrated: "demonstrated", needs_revision: "needs revision", not_assessable: "not assessable" };

function fieldLabel(attempt, lesson, fieldId) {
  const snap = attempt.contentSnapshot && attempt.contentSnapshot.fields.find(f => f.id === fieldId);
  if (snap) return snap.label;
  const f = lesson && lesson.task.fields.find(x => x.id === fieldId);
  return f ? f.label : fieldId;
}

function optionLabel(attempt, lesson, fieldId, optionId) {
  const snap = attempt.contentSnapshot && attempt.contentSnapshot.fields.find(f => f.id === fieldId);
  const opts = (snap && snap.options) || (lesson && (lesson.task.fields.find(x => x.id === fieldId) || {}).options) || [];
  const o = opts.find(x => x.id === optionId);
  return o ? o.label : optionId;
}

function criterionLabel(attempt, lesson, id) {
  const snap = attempt.contentSnapshot && attempt.contentSnapshot.rubric.find(r => r.id === id);
  if (snap) return snap.label;
  const r = lesson && lesson.rubric.find(x => x.id === id);
  return r ? r.label : id;
}

function quote(text) {
  return String(text || "").split(/\r?\n/).map(l => `> ${l}`).join("\n");
}

export function buildMarkdown(progress, content, { lessonIds, includeNotes = true, includeMeasurements = true } = {}) {
  const lines = [];
  lines.push("# AI Business Practice — selected work", "");
  lines.push(`Exported ${formatTime(nowIso())}. Saved in one browser; this file is a readable copy, not a backup for restoring.`, "");
  lines.push("Evidence states describe recorded activity, not grades or proof of expertise. Fictional cases stay fictional.", "");
  for (const lessonId of lessonIds) {
    const lesson = content.lessons.get(lessonId);
    const attempts = progress.attempts.filter(a => a.lessonId === lessonId && a.submittedAt).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    const title = lesson ? lesson.title : (attempts[0] && attempts[0].contentSnapshot ? attempts[0].contentSnapshot.title : lessonId);
    lines.push(`## ${lessonId} — ${title}`, "");
    if (lesson) {
      lines.push(`Mission ${lesson.missionId}. Objective: ${lesson.objective}`, "");
      lines.push(`Task: ${lesson.task.instruction}`, "");
    } else {
      lines.push("Archived work: this lesson is not part of the current app content.", "");
    }
    if (!attempts.length) lines.push("_No submitted revisions._", "");
    attempts.forEach((a, i) => {
      const usable = lesson && lesson.contentVersion === a.contentVersion ? lesson : null;
      const info = deriveRevision(a, usable);
      lines.push(`### Revision ${i + 1} — ${STATE_INFO[info.state || "seen"].label} (${a.evidenceKind}, content v${a.contentVersion})`, "");
      lines.push(`Submitted ${formatTime(a.submittedAt)}.${info.guided ? " Guided practice: the example answer was seen before submitting." : ""}${info.hintsUsed ? ` Hints used: ${info.hintsUsed}.` : ""}`, "");
      if (a.preAttempt && (a.preAttempt.confidence || a.preAttempt.predictedDifficulty)) {
        lines.push(`Before attempting: confidence ${a.preAttempt.confidence ? `${a.preAttempt.confidence}/5` : "not recorded"}; expected difficulty: ${a.preAttempt.predictedDifficulty || "not recorded"}.`, "");
      }
      for (const [fid, value] of Object.entries(a.submission || {})) {
        lines.push(`**${fieldLabel(a, lesson, fid)}**`, "");
        if (Array.isArray(value)) lines.push(value.length ? value.map(v => `- ${optionLabel(a, lesson, fid, v)}`).join("\n") : "_Nothing selected._", "");
        else lines.push(value ? quote(value) : "_Left empty._", "");
      }
      if (a.rubricChecks.length) {
        lines.push("**Your rubric check**", "");
        for (const r of a.rubricChecks) lines.push(`- ${criterionLabel(a, lesson, r.criterionId)}: ${RESULT_LABEL[r.result]}${r.evidenceText ? ` — ${r.evidenceText}` : ""}`);
        lines.push("");
      }
      for (const f of a.feedback) {
        lines.push(`**Feedback — ${PROVENANCE_LABEL[f.provenance]}${f.sourceLabel ? ` (${f.sourceLabel})` : ""}**`, "", quote(f.text), "");
        if (f.criterionReviews && f.criterionReviews.length) {
          lines.push("Advisory criterion results (not your rubric check):");
          for (const r of f.criterionReviews) lines.push(`- ${r.criterionId}: ${REVIEW_LABEL[r.result]}${r.evidenceText ? ` — ${r.evidenceText}` : ""}`);
          lines.push("");
        }
        lines.push(f.learnerResponse ? `Your response (${f.responseDecision || "recorded"}): ${f.learnerResponse}` : "_No response recorded yet._", "");
      }
      for (const d of a.drills || []) {
        const drill = [...content.errors.values()].find(e => e.drill.id === d.drillId);
        lines.push(`**Targeted drill — ${drill ? drill.drill.title : d.drillId}** (self-check: ${RESULT_LABEL[d.selfCheck.result]})`, "", quote(d.response), "");
      }
      for (const e of a.events.filter(x => x.type === "transfer_checked")) {
        const ev = e.evidence;
        lines.push(`**Transfer — ${ev.title || "changed case"}** (${ev.evidenceKind}; check: ${RESULT_LABEL[ev.transferCheck.result]})`, "", quote(ev.transferSubmission), "", `Check note: ${ev.transferCheck.evidenceText}`, "");
      }
    });
    const reflection = progress.notes.find(n => n.kind === "reflection" && n.lessonId === lessonId);
    if (reflection && reflection.text.trim()) lines.push("**Reflection**", "", quote(reflection.text), "");
  }
  if (includeNotes) {
    const general = progress.notes.filter(n => n.kind !== "reflection" && n.text.trim());
    if (general.length) {
      lines.push("## Notes", "");
      for (const n of general) lines.push(`- ${n.missionId ? `[${n.missionId}] ` : ""}${n.text.replace(/\r?\n/g, " ")} _(${formatTime(n.updatedAt)})_`);
      lines.push("");
    }
  }
  if (includeMeasurements && progress.measurements.length) {
    lines.push("## Measurements", "");
    for (const m of progress.measurements) lines.push(`- ${m.label}: ${m.value} ${m.unit} — ${m.kind}; ${m.period}`);
    lines.push("");
  }
  return lines.join("\n");
}

// ---- Import --------------------------------------------------------------------

export function parseImport(text) {
  const errors = [];
  const warnings = [];
  if (typeof text !== "string" || !text.trim()) return { ok: false, errors: ["The file is empty."], warnings };
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, errors: ["The file is larger than 5 MB, which is far more than a backup from this app should be."], warnings };
  let data;
  try { data = JSON.parse(text); } catch (e) {
    return { ok: false, errors: ["This is not valid JSON, so it cannot be a backup from this app."], warnings };
  }
  const shape = validateProgressShape(data);
  if (shape.length) return { ok: false, errors: shape.slice(0, 12).concat(shape.length > 12 ? [`…and ${shape.length - 12} more problems`] : []), warnings };
  if (data.missionEvents !== undefined && !Array.isArray(data.missionEvents)) return { ok: false, errors: ["missionEvents: must be a list"], warnings };
  const refs = checkProgressReferences(data);
  if (refs.problems.length) return { ok: false, errors: refs.problems, warnings: refs.warnings };
  warnings.push(...refs.warnings);
  if (data.sampleOnly) warnings.push("This file says it is a synthetic sample, not real work.");
  return { ok: true, errors, warnings, data };
}

function keyFor(collection, record) {
  return collection === "drafts" ? `drafts:${record.lessonId}` : `${collection}:${record.id}`;
}

function describe(collection, r) {
  switch (collection) {
    case "drafts": return `Draft for ${r.lessonId}`;
    case "attempts": return `${r.lessonId} ${r.submittedAt ? `revision submitted ${formatTime(r.submittedAt)}` : "opened, not submitted"}`;
    case "notes": return `Note: ${String(r.text).slice(0, 60)}${r.text.length > 60 ? "…" : ""}`;
    case "measurements": return `Measurement: ${r.label}`;
    default: return `${collection} ${r.id}`;
  }
}

export function planImport(local, imported, content) {
  const items = [];
  for (const c of COLLECTIONS) {
    const localMap = new Map((local[c] || []).map(r => [keyFor(c, r), r]));
    for (const r of imported[c] || []) {
      const k = keyFor(c, r);
      const mine = localMap.get(k);
      let status = "new";
      if (mine) status = sameRecord(c, mine, r) ? "identical" : "conflict";
      items.push({ key: k, collection: c, label: describe(c, r), status, local: mine || null, imported: r });
    }
  }
  // The same revision under a different attempt ID is also a conflict.
  const localRevs = new Map(local.attempts.map(a => [a.revisionId, a]));
  for (const it of items) {
    if (it.collection === "attempts" && it.status === "new") {
      const clash = localRevs.get(it.imported.revisionId);
      if (clash) { it.status = "conflict"; it.local = clash; it.revisionClash = true; }
    }
  }
  const unknownLessons = [...new Set(imported.attempts.concat(imported.drafts).map(r => r.lessonId).filter(id => !content.lessons.has(id)))];
  const stateCorrections = [];
  for (const a of imported.attempts) {
    const lesson = content.lessons.get(a.lessonId);
    const usable = lesson && lesson.contentVersion === a.contentVersion ? lesson : null;
    const derived = deriveRevision(a, usable).state || "seen";
    if (derived !== a.state) stateCorrections.push({ attemptId: a.id, lessonId: a.lessonId, label: a.state, derived });
  }
  const versionNotes = [];
  for (const a of imported.attempts) {
    const lesson = content.lessons.get(a.lessonId);
    if (lesson && lesson.contentVersion !== a.contentVersion) versionNotes.push(`${a.lessonId}: a revision was written for content v${a.contentVersion}; the app now has v${lesson.contentVersion}. It is kept as history.`);
  }
  return {
    items,
    counts: {
      new: items.filter(i => i.status === "new").length,
      identical: items.filter(i => i.status === "identical").length,
      conflict: items.filter(i => i.status === "conflict").length
    },
    unknownLessons, stateCorrections, versionNotes: [...new Set(versionNotes)],
    profileDiffers: !deepEqual(local.profile, imported.profile)
  };
}

function sameRecord(collection, a, b) {
  if (collection === "attempts") {
    const strip = x => ({ ...x, state: undefined });
    return deepEqual(strip(a), strip(b));
  }
  if (collection === "drafts") return deepEqual({ ...a, updatedAt: undefined }, { ...b, updatedAt: undefined });
  return deepEqual(a, b);
}

// decisions: { [item.key]: "local" | "imported" } — required for every conflict.
export function applyImport(local, imported, plan, decisions, content) {
  const undecided = plan.items.filter(i => i.status === "conflict" && !["local", "imported"].includes(decisions[i.key]));
  if (undecided.length) return { ok: false, error: `Choose keep-local or use-imported for ${undecided.length} conflicting record(s).` };
  const next = clone(local);
  for (const c of COLLECTIONS) if (!next[c]) next[c] = [];
  for (const it of plan.items) {
    if (it.status === "identical") continue;
    if (it.status === "conflict" && decisions[it.key] === "local") continue;
    const list = next[it.collection];
    if (it.status === "conflict") {
      const idx = list.findIndex(r => r === undefined ? false : (it.revisionClash ? r.revisionId === it.imported.revisionId : keyFor(it.collection, r) === it.key));
      if (idx >= 0) list.splice(idx, 1);
    }
    list.push(clone(it.imported));
  }
  recomputeStates(next, content);
  const shape = validateProgressShape({ ...next, exportedAt: nowIso() });
  const refs = checkProgressReferences(next);
  if (shape.length || refs.problems.length) return { ok: false, error: `The merged result failed validation, so nothing was changed: ${shape.concat(refs.problems).slice(0, 3).join("; ")}` };
  return { ok: true, progress: next };
}
