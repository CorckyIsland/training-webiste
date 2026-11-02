import { h, pre } from "../dom.js";
import { deriveRevision, lessonStatus, orderedRevisions, STATE_INFO } from "../evidence.js";
import * as M from "../model.js";
import { renderSubmission } from "./lesson.js";
import { stateChip, provenanceChip, resultChip, pills, textField, inlineMessage, toast, REVIEW_LABEL } from "../ui.js";
import { formatTime } from "../util.js";

export function renderWork(app) {
  const { content, store } = app;
  const p = store.data;
  const meta = store.meta;
  const view = h("div", { class: "stack-lg" });
  view.dataset.title = "My Work";
  view.appendChild(h("div", null, h("p", { class: "eyebrow" }, "My Work"), h("h1", null, "Attempts, feedback and evidence")));

  view.appendChild(h("div", { class: "card stack" },
    h("p", null, h("strong", null, "Saved on this browser"), store.status.lastSavedAt ? ` · last saved ${formatTime(store.status.lastSavedAt)}` : ""),
    h("p", { class: "small muted" }, `Last export: ${meta.lastExportAt ? formatTime(meta.lastExportAt) : "never"}. Your phone and tablet keep separate copies; an export is how you move or keep work.`),
    h("div", { class: "row" },
      h("a", { class: "btn primary", href: "#/settings/export" }, "Export"),
      h("a", { class: "btn", href: "#/settings/import" }, "Import or restore"))));

  // Lessons with work.
  const lessonsWithWork = content.lessonOrder.map(id => content.lessons.get(id)).filter(l => p.attempts.some(a => a.lessonId === l.id) || M.getDraft(p, l.id));
  const lessonsBox = h("section", { class: "stack" }, h("h2", null, "Lessons"));
  if (!lessonsWithWork.length) lessonsBox.appendChild(h("p", { class: "muted" }, "No lesson work yet. Start from Today."));
  for (const lesson of lessonsWithWork) {
    const st = lessonStatus(p, lesson);
    const revs = orderedRevisions(p, lesson.id);
    lessonsBox.appendChild(h("div", { class: "card stack" },
      h("div", { class: "row" }, h("span", { class: "eyebrow" }, `${lesson.missionId} · ${lesson.id}`), stateChip(st.state), M.missionSkipped(p, lesson.missionId) ? h("span", { class: "chip warn" }, "Skipped") : null),
      h("h3", null, h("a", { href: `#/lesson/${lesson.id}` }, lesson.title)),
      revs.length ? h("ul", { class: "list" }, revs.map((a, i) => {
        const info = deriveRevision(a, a.contentVersion === lesson.contentVersion ? lesson : null);
        return h("li", null, h("a", { class: "list-item", href: `#/work/attempt/${encodeURIComponent(a.id)}` },
          h("span", { class: "title" }, a.submittedAt ? `Submitted ${formatTime(a.submittedAt)}` : "Opened — not submitted"),
          h("span", { class: "meta" }, stateChip(info.state), `${a.feedback.length} feedback`, `v${a.contentVersion}`, a.evidenceKind, info.guided ? h("span", { class: "chip warn" }, "Guided") : null)));
      })) : null));
  }
  view.appendChild(lessonsBox);

  // Archived work for lessons this version of the app does not have.
  const archived = p.attempts.filter(a => !content.lessons.has(a.lessonId));
  const archivedDrafts = p.drafts.filter(d => !content.lessons.has(d.lessonId));
  if (archived.length || archivedDrafts.length) {
    view.appendChild(h("section", { class: "stack" },
      h("h2", null, "Archived work"),
      h("p", { class: "small muted" }, "These records belong to lessons that are not in this version of the app. They are kept unchanged and included in backups."),
      h("ul", { class: "list" },
        archived.map(a => h("li", null, h("a", { class: "list-item", href: `#/work/attempt/${encodeURIComponent(a.id)}` },
          h("span", { class: "title" }, `${a.lessonId} · ${a.contentSnapshot ? a.contentSnapshot.title : a.missionId}`),
          h("span", { class: "meta" }, `content v${a.contentVersion}`, a.submittedAt ? `submitted ${formatTime(a.submittedAt)}` : "not submitted")))),
        archivedDrafts.map(d => h("li", { class: "list-item" }, h("span", { class: "title" }, `Draft for ${d.lessonId}`), h("span", { class: "meta" }, `updated ${formatTime(d.updatedAt)}`))))));
  }

  view.appendChild(notesSection(app));
  view.appendChild(measurementsSection(app));
  return view;
}

function notesSection(app) {
  const { store, content } = app;
  const p = store.data;
  const box = h("section", { class: "stack" }, h("h2", null, "Notes"));
  const missionNotes = p.notes.filter(n => n.kind === "mission" && n.text.trim());
  const reflections = p.notes.filter(n => n.kind === "reflection" && n.text.trim());
  const general = p.notes.filter(n => !n.kind || n.kind === "general");
  let text = "";
  const msg = h("div");
  box.appendChild(h("div", { class: "card stack" },
    textField({ label: "New note", long: true, short: true, value: "", onInput: v => { text = v; } }),
    msg,
    h("button", { type: "button", class: "primary", onclick: () => {
      if (!text.trim()) return inlineMessage(msg, "Write something first.");
      store.update(pp => M.upsertNote(pp, { text, kind: "general" }), { immediate: true });
      app.rerender({ keepScroll: true });
    } }, "Add note")));
  for (const n of general.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    box.appendChild(h("div", { class: "card tight stack" },
      textField({ label: `Note · ${formatTime(n.updatedAt)}`, long: true, short: true, value: n.text, onInput: v => store.update(pp => M.upsertNote(pp, { id: n.id, text: v })) }),
      h("button", { type: "button", class: "danger", onclick: () => {
        if (!confirm("Delete this note? This cannot be undone (unless you have an export).")) return;
        store.update(pp => M.deleteNote(pp, n.id), { immediate: true });
        app.rerender({ keepScroll: true });
      } }, "Delete note")));
  }
  if (reflections.length || missionNotes.length) {
    box.appendChild(h("details", { class: "disclosure" },
      h("summary", null, `Lesson reflections and mission notes (${reflections.length + missionNotes.length})`),
      h("div", { class: "body stack" },
        reflections.map(n => h("div", null, h("p", { class: "field-label" }, h("a", { href: `#/lesson/${n.lessonId}` }, `Reflection · ${n.lessonId}`)), pre(n.text, "small"))),
        missionNotes.map(n => h("div", null, h("p", { class: "field-label" }, h("a", { href: `#/mission/${n.missionId}` }, `${n.missionId} · ${(content.missions.get(n.missionId) || {}).title || ""}`)), pre(n.text, "small"))))));
  }
  return box;
}

function measurementsSection(app) {
  const { store } = app;
  const p = store.data;
  const box = h("section", { class: "stack" }, h("h2", null, "Measurements"),
    h("p", { class: "small muted" }, "Keep observed results, estimates and fictional figures apart. The app stores numbers; it does not validate assumptions or turn freed time into cash savings."));
  const form = { label: "", kind: null, unit: "", value: "", period: "" };
  const msg = h("div");
  box.appendChild(h("div", { class: "card stack" },
    textField({ label: "What was measured", value: "", placeholder: "e.g. Checked handling time per enquiry", onInput: v => { form.label = v; } }),
    pills("m-kind", [["observed", "Observed"], ["estimated", "Estimated"], ["fictional", "Fictional"]], null, v => { form.kind = v; }, "Kind"),
    h("div", { class: "two-col stack" },
      textField({ label: "Value (number)", value: "", onInput: v => { form.value = v; } }),
      textField({ label: "Unit", value: "", placeholder: "e.g. minutes_per_case", onInput: v => { form.unit = v; } })),
    textField({ label: "Period or sample", value: "", placeholder: "e.g. 10 consecutive enquiries, week 2", onInput: v => { form.period = v; } }),
    msg,
    h("button", { type: "button", class: "primary", onclick: () => {
      const res = store.update(pp => M.addMeasurement(pp, form), { immediate: true });
      if (!res.ok) return inlineMessage(msg, res.error);
      toast("Measurement saved.");
      app.rerender({ keepScroll: true });
    } }, "Add measurement")));
  if (p.measurements.length) {
    box.appendChild(h("ul", { class: "list" }, p.measurements.map(m => h("li", { class: "list-item" },
      h("span", { class: "title" }, `${m.label}: ${m.value} ${m.unit}`),
      h("span", { class: "meta" }, h("span", { class: m.kind === "observed" ? "chip good" : m.kind === "estimated" ? "chip warn" : "chip outline" }, m.kind), m.period),
      h("button", { type: "button", class: "link", onclick: () => {
        if (!confirm("Delete this measurement?")) return;
        store.update(pp => M.deleteMeasurement(pp, m.id), { immediate: true });
        app.rerender({ keepScroll: true });
      } }, "Delete")))));
  }
  return box;
}

export function renderAttemptDetail(app, attemptId) {
  const { content, store } = app;
  const a = store.data.attempts.find(x => x.id === attemptId);
  if (!a) return h("div", { class: "stack" }, h("h1", null, "Attempt not found"), h("a", { href: "#/work" }, "Back to My Work"));
  const lesson = content.lessons.get(a.lessonId) || null;
  const usable = lesson && lesson.contentVersion === a.contentVersion ? lesson : null;
  const info = deriveRevision(a, usable);
  const title = lesson ? lesson.title : (a.contentSnapshot ? a.contentSnapshot.title : a.lessonId);
  const view = h("div", { class: "stack-lg" });
  view.dataset.title = `${a.lessonId} revision`;
  view.appendChild(h("div", { class: "stack" },
    h("a", { href: "#/work", class: "small" }, "← My Work"),
    h("p", { class: "eyebrow" }, `${a.missionId} · ${a.lessonId} · content v${a.contentVersion}`),
    h("h1", null, title),
    h("div", { class: "row" }, stateChip(info.state), h("span", { class: "chip outline" }, a.evidenceKind), info.guided ? h("span", { class: "chip warn" }, "Guided practice") : null, info.hintsUsed ? h("span", { class: "chip outline" }, `${info.hintsUsed} hints`) : null),
    !lesson ? h("p", { class: "banner warn" }, "Archived: this lesson is not part of the current app content. The record is kept unchanged.") : null,
    lesson && !usable ? h("p", { class: "banner warn" }, `Written for content v${a.contentVersion}; the lesson is now v${lesson.contentVersion}. Shown as history.`) : null,
    lesson ? h("a", { href: `#/lesson/${lesson.id}` }, "Open the lesson") : null,
    h("p", { class: "small muted" }, `State derived from this revision’s own events: ${STATE_INFO[info.state || "seen"].label}. ${a.supersedesRevisionId ? "This revision supersedes an earlier one; earlier checks stay with that revision." : ""}`)));

  if (a.submittedAt) {
    view.appendChild(h("section", { class: "stack" }, h("h2", null, "Submitted attempt"), h("p", { class: "small muted" }, formatTime(a.submittedAt)), renderSubmission(a, lesson)));
  } else view.appendChild(h("p", { class: "locked-note" }, "This revision was opened but not submitted."));

  if (a.preAttempt && (a.preAttempt.confidence || a.preAttempt.predictedDifficulty)) {
    view.appendChild(h("section", { class: "stack" }, h("h2", null, "Before attempting"),
      h("dl", { class: "kv" }, h("dt", null, "Confidence"), h("dd", null, a.preAttempt.confidence ? `${a.preAttempt.confidence} / 5` : "—"), h("dt", null, "Expected difficulty"), h("dd", null, a.preAttempt.predictedDifficulty || "—"))));
  }

  if (a.rubricChecks.length) {
    const labels = new Map(((a.contentSnapshot && a.contentSnapshot.rubric) || (lesson ? lesson.rubric : [])).map(r => [r.id, r]));
    view.appendChild(h("section", { class: "stack" }, h("h2", null, "Your rubric check"),
      h("ul", { class: "list" }, a.rubricChecks.map(c => h("li", { class: "list-item" },
        h("span", { class: "row" }, h("strong", null, labels.get(c.criterionId) ? labels.get(c.criterionId).label : c.criterionId), resultChip(c.result)),
        c.evidenceText ? h("span", { class: "small" }, c.evidenceText) : null)))));
  }

  if (a.feedback.length) {
    view.appendChild(h("section", { class: "stack" }, h("h2", null, "Feedback"),
      a.feedback.map(f => h("div", { class: "feedback-item stack" },
        h("div", { class: "row" }, provenanceChip(f.provenance), f.sourceLabel ? h("span", { class: "chip outline" }, f.sourceLabel) : null),
        pre(f.text),
        f.criterionReviews && f.criterionReviews.length ? h("div", { class: "small" }, h("p", { class: "muted" }, "Advisory criterion results (not your rubric check):"),
          h("ul", null, f.criterionReviews.map(r => h("li", null, `${r.criterionId}: ${REVIEW_LABEL[r.result]}${r.evidenceText ? ` — ${r.evidenceText}` : ""}`)))) : null,
        f.learnerResponse ? h("p", { class: "notice" }, h("strong", null, `Your response (${f.responseDecision || "recorded"}): `), f.learnerResponse) : h("p", { class: "small muted" }, "No response recorded.")))));
  }

  if (a.drills && a.drills.length) {
    const all = [...content.errors.values()];
    view.appendChild(h("section", { class: "stack" }, h("h2", null, "Targeted drills"),
      a.drills.map(d => { const e = all.find(x => x.drill.id === d.drillId); return h("div", { class: "card tight stack" }, h("div", { class: "row" }, h("strong", null, e ? e.drill.title : d.drillId), resultChip(d.selfCheck.result)), h("p", { class: "small muted" }, d.trigger || ""), pre(d.response)); })));
  }

  const transfers = a.events.filter(e => e.type === "transfer_checked");
  if (transfers.length) {
    view.appendChild(h("section", { class: "stack" }, h("h2", null, "Transfer attempts"),
      transfers.map(e => h("div", { class: "card tight stack" },
        h("div", { class: "row" }, h("strong", null, e.evidence.title || "Changed case"), h("span", { class: "chip outline" }, e.evidence.evidenceKind), resultChip(e.evidence.transferCheck.result)),
        pre(e.evidence.transferSubmission), h("p", { class: "small muted" }, `Check: ${e.evidence.transferCheck.evidenceText}`)))));
  }

  view.appendChild(h("section", { class: "stack" }, h("h2", null, "Event record"),
    h("ul", { class: "timeline" }, a.events.slice().sort((x, y) => x.createdAt.localeCompare(y.createdAt)).map(e => h("li", null, h("span", { class: "muted" }, formatTime(e.createdAt)), h("strong", null, e.type.replace(/_/g, " ")))))));
  return view;
}
