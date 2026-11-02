import { h, renderMarkdown, pre, copyText } from "../dom.js";
import { lessonStatus, nextAction, deriveRevision, STATES, STATE_INFO, attemptsForLesson, orderedRevisions } from "../evidence.js";
import * as M from "../model.js";
import { buildReviewPacket, parseCriterionLines } from "../packet.js";
import { missionInfo } from "./course.js";
import { stateChip, provenanceChip, resultChip, pills, textField, toast, inlineMessage, sectionHead, RESULT_LABEL, REVIEW_LABEL } from "../ui.js";
import { formatTime, isBlank } from "../util.js";

const RESULTS = [["met", "Met"], ["needs_work", "Needs work"], ["uncertain", "Uncertain"]];

export function renderLesson(app, lessonId) {
  const { content, store } = app;
  const lesson = content.lessons.get(lessonId);
  if (!lesson) {
    return h("div", { class: "stack" }, h("h1", null, "Lesson not available"),
      h("p", null, `There is no lesson ${lessonId} in this version of the app. Any saved work for it is kept under Archived work in My Work.`),
      h("a", { href: "#/work" }, "Go to My Work"));
  }
  // Opening records `seen` once; re-opening changes nothing.
  const p0 = store.data;
  const atts = attemptsForLesson(p0, lesson.id);
  const w0 = atts.find(a => !a.submittedAt);
  if (!atts.length || (w0 && !w0.events.some(e => e.type === "opened"))) store.update(p => M.openLesson(p, lesson), { immediate: true });

  const p = store.data;
  const st = lessonStatus(p, lesson);
  const mission = content.missions.get(lesson.missionId);
  const target = st.active && !st.outdated ? st.active : null; // revision that checks attach to
  const ctx = { app, lesson, st, target, mission };

  const view = h("div", { class: "lesson" });
  view.dataset.title = `${lesson.id} ${lesson.title}`;
  view.appendChild(header(ctx));
  view.appendChild(statusCard(ctx));
  view.appendChild(sectionBefore(ctx));
  view.appendChild(sectionCase(ctx));
  view.appendChild(sectionAttempt(ctx));
  view.appendChild(sectionCheck(ctx));
  view.appendChild(sectionFeedback(ctx));
  view.appendChild(sectionPractice(ctx));
  view.appendChild(sectionTransfer(ctx));
  view.appendChild(sectionReflection(ctx));
  view.appendChild(sectionAnswer(ctx));
  view.appendChild(sectionHistory(ctx));
  return view;
}

// ---------------------------------------------------------------------------

function header({ lesson, mission, app }) {
  return h("div", { class: "stack" },
    h("a", { href: "#/course", class: "small" }, "← Course"),
    h("p", { class: "eyebrow" }, `${lesson.missionId} · ${lesson.id} · content v${lesson.contentVersion}`),
    h("h1", null, lesson.title),
    h("p", null, lesson.objective),
    h("div", { class: "row" },
      h("span", { class: "chip outline" }, `${lesson.estimatedMinutes} min core`),
      mission ? h("span", { class: "chip outline" }, `${mission.activeMinutes} min mission`) : null,
      h("span", { class: "chip outline" }, "Phone or tablet · no terminal"),
      h("span", { class: "chip info" }, lesson.scenario.label)),
    mission ? missionInfo(app, mission, { compact: true }) : null);
}

function revisionNumber(st, attempt) {
  const subs = st.revisions.filter(r => r.submittedAt);
  const i = subs.indexOf(attempt);
  return i >= 0 ? i + 1 : subs.length + 1;
}

function statusCard(ctx) {
  const { app, lesson, st, target } = ctx;
  const p = app.store.data;
  const act = nextAction(st);
  const anchor = { start: "sec-before", attempt: "sec-attempt", fresh: "sec-attempt", rubric: "sec-check", feedback: "sec-feedback", transfer: "sec-transfer", done: "sec-history" }[act.key];
  const shown = target || st.working;
  const info = shown ? deriveRevision(shown, lesson) : null;
  const skipped = M.missionSkipped(p, lesson.missionId);
  const card = h("div", { class: "card accent stack status-card" });
  const label = target ? `Revision ${revisionNumber(st, target)}` : st.working ? `Revision ${revisionNumber(st, st.working)} (draft)` : "Not started";
  card.appendChild(h("div", { class: "row" }, h("strong", null, label), stateChip(info ? info.state : null),
    info && info.guided ? h("span", { class: "chip warn" }, "Guided practice") : null,
    info && info.hintsUsed ? h("span", { class: "chip outline" }, `${info.hintsUsed} hint${info.hintsUsed > 1 ? "s" : ""} used`) : null,
    skipped ? h("span", { class: "chip warn" }, "Mission skipped") : null));
  if (info) {
    card.appendChild(h("ol", { class: "stepper", "aria-label": "Evidence recorded for this revision" },
      STATES.map(s => h("li", { class: info.flags[s] ? "on" : "", title: STATE_INFO[s].evidence }, STATE_INFO[s].label))));
  }
  if (target && st.working) card.appendChild(h("p", { class: "small muted" }, `You are drafting revision ${revisionNumber(st, st.working)}. The checks below still belong to revision ${revisionNumber(st, target)}, submitted ${formatTime(target.submittedAt)}.`));
  if (st.outdated) card.appendChild(h("p", { class: "banner warn" }, `Your latest submitted revision was written for content v${st.active.contentVersion}; the exercise is now v${lesson.contentVersion}. That work stays in your history, unchanged. Start a fresh attempt to record new checks.`));
  card.appendChild(h("p", null, h("strong", null, "Next: "), act.text));
  card.appendChild(h("div", { class: "actions" },
    h("a", { class: "btn primary", href: `#/lesson/${lesson.id}`, onclick: e => { e.preventDefault(); const el = document.getElementById(anchor); if (el) { el.scrollIntoView({ block: "start" }); el.focus({ preventScroll: true }); } } }, act.key === "done" ? "See revision history" : "Go to the next step"),
    skipped
      ? h("button", { type: "button", onclick: () => { app.store.update(pp => M.markMission(pp, lesson.missionId, "unskipped"), { immediate: true }); app.rerender({ keepScroll: true }); } }, "Un-skip")
      : h("button", { type: "button", onclick: () => { app.store.update(pp => M.markMission(pp, lesson.missionId, "skipped"), { immediate: true }); toast("Marked as skipped — not passed. The lesson stays open."); app.rerender({ keepScroll: true }); } }, "Skip for now")));
  card.appendChild(h("p", { class: "small muted" }, "These states record what you did. They are not grades and do not certify skill."));
  return card;
}

function section(id, num, title, done, ...children) {
  return h("section", { class: `section ${done ? "done" : ""}`, id, tabindex: "-1", "aria-labelledby": `${id}-h` },
    (() => { const sh = sectionHead(num, title, done); sh.querySelector("h2").id = `${id}-h`; return sh; })(),
    h("div", { class: "stack" }, children));
}

// 1 — Confidence and predicted difficulty, before attempting.
function sectionBefore({ app, lesson, st }) {
  const { store } = app;
  if (!st.working) {
    const pa = (st.active && st.active.preAttempt) || {};
    return section("sec-before", 1, "Before you start", true,
      h("p", { class: "muted small" }, "Recorded before your latest submitted revision:"),
      h("dl", { class: "kv" },
        h("dt", null, "Confidence"), h("dd", null, pa.confidence ? `${pa.confidence} / 5` : "Not recorded"),
        h("dt", null, "Expected difficulty"), h("dd", null, pa.predictedDifficulty || "Not recorded")));
  }
  const d = M.getDraft(store.data, lesson.id);
  const pa = (d && d.preAttempt) || {};
  const done = !!(pa.confidence || pa.predictedDifficulty);
  return section("sec-before", 1, "Before you start", done,
    h("p", null, "A quick calibration note. It is compared with your own rubric afterwards, descriptively — it never becomes a score."),
    pills(`conf-${lesson.id}`, [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]], pa.confidence ? String(pa.confidence) : null,
      v => store.update(pp => M.setPreAttempt(pp, lesson, { confidence: Number(v) })),
      "How confident are you that you can do this task well? (1 = not at all, 5 = very; optional)"),
    textField({ label: "Which part do you expect to be hardest?", long: true, short: true, value: pa.predictedDifficulty,
      onInput: v => store.update(pp => M.setPreAttempt(pp, lesson, { predictedDifficulty: v })) }));
}

// 2 — The authored case. Everything here is displayed as inert text.
function sectionCase({ lesson }) {
  const s = lesson.scenario;
  return section("sec-case", 2, "The case", false,
    h("p", null, h("span", { class: "chip info" }, s.label), " Names, places, prices and records are invented for practice."),
    h("h3", null, "What is known"),
    h("ul", { class: "facts" }, s.facts.map(f => h("li", null, f))),
    h("h3", null, "Input"),
    pre(s.inputText, "quote"),
    s.flawedOutput ? h("div", { class: "flawed stack" }, h("p", { class: "eyebrow" }, s.flawedOutputLabel || "AI draft to review"), pre(s.flawedOutput)) : null);
}

function maxWordsFrom(label) {
  const m = /at most (\d+) words/i.exec(label) || /below (\d+) words/i.exec(label);
  return m ? Number(m[1]) : undefined;
}

// 3 — The attempt: draft fields, progressive hints, explicit submission.
function sectionAttempt(ctx) {
  const { app, lesson, st } = ctx;
  const { store } = app;
  if (!st.working) {
    const a = st.active;
    if (!a) return section("sec-attempt", 3, "Your attempt", false, h("p", null, "Open the lesson to start an attempt."));
    return section("sec-attempt", 3, "Your attempt", true,
      h("p", { class: "muted small" }, `Revision ${revisionNumber(st, a)} — submitted ${formatTime(a.submittedAt)}. A submitted revision is fixed; changing it creates a new revision.`),
      renderSubmission(a, lesson),
      h("div", { class: "actions" },
        h("button", { type: "button", class: st.outdated ? "" : "primary", disabled: st.outdated, onclick: () => {
          store.update(pp => M.startRevision(pp, lesson), { immediate: true });
          app.rerender({ focus: "#sec-attempt" });
        } }, "Revise this answer"),
        h("button", { type: "button", class: st.outdated ? "primary" : "", onclick: () => {
          if (!st.outdated && !confirm("Start a fresh attempt with empty fields? Your earlier revisions stay in your history.")) return;
          store.update(pp => M.startRevision(pp, lesson, { blank: true }), { immediate: true });
          app.rerender({ focus: "#sec-before" });
        } }, "Start a fresh attempt")));
  }
  const d = M.getDraft(store.data, lesson.id);
  const values = d ? d.values : {};
  const fields = lesson.task.fields.map(f => fieldEditor(store, lesson, f, values[f.id]));
  const msg = h("div");
  const hintsBox = hints(ctx);
  return section("sec-attempt", 3, "Your attempt", false,
    h("p", null, lesson.task.instruction),
    d && d.contentVersion !== lesson.contentVersion ? h("p", { class: "banner warn" }, `This draft was started on content v${d.contentVersion}; the exercise is now v${lesson.contentVersion}. Check your answers still fit before submitting.`) : null,
    fields,
    hintsBox,
    h("p", { class: "small muted" }, "Your draft saves as you type. Submitting fixes this revision so checks and feedback can refer to it."),
    msg,
    h("button", { type: "button", class: "primary btn-block", onclick: () => {
      const dd = M.getDraft(store.data, lesson.id);
      const empty = M.emptyFields(lesson, (dd && dd.values) || {});
      if (empty.length === lesson.task.fields.length) return inlineMessage(msg, "There is nothing to submit yet.");
      if (empty.length && !confirm(`These are empty:\n• ${empty.join("\n• ")}\n\nSubmit anyway? Empty fields are incomplete evidence, not a judgement of skill.`)) return;
      const res = store.update(pp => M.submitAttempt(pp, lesson), { immediate: true });
      if (!res.ok) return inlineMessage(msg, res.error);
      toast(app.store.status.kind === "saved" ? "Attempt submitted and saved on this browser." : "Attempt submitted, but NOT saved — see the message at the top.");
      app.rerender({ focus: "#sec-check" });
    } }, "Submit attempt"));
}

function fieldEditor(store, lesson, f, value) {
  if (f.kind === "multi_select") {
    const chosen = new Set(Array.isArray(value) ? value : []);
    const name = `${lesson.id}-${f.id}`;
    return h("fieldset", { class: "stack" },
      h("legend", null, f.label),
      h("p", { class: "small muted" }, "Select all that apply. Only these selections can be checked automatically, against an authored key."),
      h("div", { class: "choices" }, f.options.map(o => {
        const input = h("input", { type: "checkbox", name, value: o.id, checked: chosen.has(o.id), onchange: () => {
          if (input.checked) chosen.add(o.id); else chosen.delete(o.id);
          const ordered = f.options.map(x => x.id).filter(id => chosen.has(id));
          store.update(pp => M.setDraftValue(pp, lesson, f.id, ordered));
        } });
        return h("label", { class: "choice" }, input, h("span", null, o.label));
      })));
  }
  return textField({ label: f.label, long: true, short: f.kind === "short_text", value, maxWords: maxWordsFrom(f.label),
    onInput: v => store.update(pp => M.setDraftValue(pp, lesson, f.id, v)) });
}

function hints({ app, lesson, st }) {
  const target = st.working || st.active;
  const shown = new Set((target ? target.events : []).filter(e => e.type === "hint_revealed").map(e => e.evidence.hintIndex));
  const box = h("div", { class: "stack" });
  if (!lesson.hints.length) return box;
  lesson.hints.forEach((t, i) => { if (shown.has(i)) box.appendChild(h("div", { class: "notice" }, h("strong", null, `Hint ${i + 1}: `), t)); });
  const next = lesson.hints.findIndex((_, i) => !shown.has(i));
  if (next >= 0) box.appendChild(h("button", { type: "button", onclick: () => {
    app.store.update(pp => M.revealHint(pp, lesson, next), { immediate: true });
    app.rerender({ keepScroll: true });
  } }, `Show hint ${next + 1} of ${lesson.hints.length}`));
  box.appendChild(h("p", { class: "small muted" }, "Using a hint is recorded as assistance. It does not change your evidence state."));
  return box;
}

export function renderSubmission(a, lesson) {
  const snap = a.contentSnapshot;
  const fields = (snap && snap.fields) || (lesson ? lesson.task.fields : Object.keys(a.submission).map(id => ({ id, label: id, kind: Array.isArray(a.submission[id]) ? "multi_select" : "long_text" })));
  return h("div", { class: "submitted stack" }, fields.map(f => {
    const v = a.submission[f.id];
    let body;
    if (f.kind === "multi_select") {
      const labels = (v || []).map(id => ((f.options || []).find(o => o.id === id) || { label: id }).label);
      body = labels.length ? h("ul", null, labels.map(l => h("li", null, l))) : h("p", { class: "muted" }, "Nothing selected.");
    } else body = isBlank(v) ? h("p", { class: "muted" }, "Left empty.") : pre(v);
    return h("div", null, h("p", { class: "field-label" }, f.label), body);
  }));
}

function lockedNote(ctx, what) {
  const { st, lesson } = ctx;
  if (st.outdated) return h("p", { class: "locked-note" }, `Your latest revision belongs to content v${st.active.contentVersion}. ${what} for the current version start with a fresh attempt.`);
  return h("p", { class: "locked-note" }, `${what} become available after you submit an attempt, so they always belong to a specific submitted revision. You can still read everything else in this lesson.`);
}

// 4 — Answer-key check (selections only) and the learner's manual rubric.
function sectionCheck(ctx) {
  const { app, lesson, target } = ctx;
  if (!target) return section("sec-check", 4, "Check against the rubric", false, lockedNote(ctx, "Rubric checks"));
  const info = deriveRevision(target, lesson);
  const store = app.store;
  const children = [];

  const keyed = target.feedback.filter(f => f.provenance === "authored_choice_key" && f.choiceCheck);
  for (const fb of keyed) children.push(choiceCheckBox(lesson, fb));
  const free = lesson.task.fields.filter(f => f.kind !== "multi_select");
  children.push(h("div", { class: "notice" },
    h("strong", null, "Not assessed: "),
    `${free.map(f => `“${f.label}”`).join(", ")}. The app does not grade written answers. Use the rubric below, and optionally an external review.`));

  const editing = getUi(target.revisionId, "editRubric");
  if (info.flags.self_checked && !editing) {
    children.push(rubricSummary(lesson, target));
    children.push(calibration(target));
    children.push(h("button", { type: "button", onclick: () => { setUi(target.revisionId, "editRubric", true); app.rerender({ keepScroll: true }); } }, "Edit rubric check"));
  } else {
    children.push(rubricForm(ctx));
  }
  return section("sec-check", 4, "Check against the rubric", info.flags.self_checked, children);
}

function choiceCheckBox(lesson, fb) {
  const field = lesson.task.fields.find(f => f.id === fb.choiceCheck.fieldId);
  if (!field) return pre(fb.text);
  const missed = new Set(fb.choiceCheck.missed), extra = new Set(fb.choiceCheck.extra), matched = new Set(fb.choiceCheck.matched);
  return h("div", { class: "card tight stack" },
    h("div", { class: "row" }, provenanceChip("authored_choice_key")),
    h("p", null, `Your selections compared with the authored key: ${matched.size} of ${matched.size + missed.size} unsupported or contradicted claims selected.`),
    h("ul", { class: "list" }, field.options.map(o => {
      let chip, note;
      if (matched.has(o.id)) { chip = h("span", { class: "chip good" }, "Selected — matches key"); }
      else if (missed.has(o.id)) { chip = h("span", { class: "chip warn" }, "Not selected"); note = "The case does not establish this, so it cannot be sent as fact."; }
      else if (extra.has(o.id)) { chip = h("span", { class: "chip info" }, "Selected — but supplied"); note = "This was supplied by the enquiry. Compare it with the source before treating it as unsafe."; }
      else { chip = h("span", { class: "chip outline" }, "Not selected — supplied fact"); }
      return h("li", { class: "list-item" }, h("span", null, o.label), h("span", { class: "meta" }, chip), note ? h("span", { class: "small muted" }, note) : null);
    })),
    h("p", { class: "small muted" }, "This check covers the selections only — not your reply or explanation."));
}

function rubricForm({ app, lesson, target }) {
  const store = app.store;
  const existing = Object.fromEntries(target.rubricChecks.map(r => [r.criterionId, { result: r.result, evidenceText: r.evidenceText }]));
  const draft = { ...existing, ...(M.getReviewDraft(store.data, lesson.id, target.revisionId, "rubric") || {}) };
  const save = () => store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "rubric", draft));
  const msg = h("div");
  return h("div", { class: "card stack" },
    h("p", null, "Compare your submitted attempt with each criterion. Point to the words in your attempt that support your judgement. ", h("strong", null, "Critical"), " criteria are consequential on their own — good tone does not offset them."),
    lesson.rubric.map(r => {
      const cur = draft[r.id] || {};
      return h("div", { class: "criterion stack" },
        h("div", { class: "row" }, h("h3", null, r.label), r.critical ? h("span", { class: "chip bad" }, "Critical") : null, h("span", { class: "muted small" }, r.id)),
        h("p", { class: "small" }, h("strong", null, "Met when: "), r.passEvidence),
        pills(`rub-${target.revisionId}-${r.id}`, RESULTS, cur.result, v => { draft[r.id] = { ...(draft[r.id] || {}), result: v }; save(); }, null),
        textField({ label: "Evidence from your attempt", long: true, short: true, value: cur.evidenceText,
          onInput: v => { draft[r.id] = { ...(draft[r.id] || {}), evidenceText: v }; save(); } }));
    }),
    msg,
    h("button", { type: "button", class: "primary btn-block", onclick: () => {
      const res = store.update(pp => M.recordRubric(pp, lesson, target, draft), { immediate: true });
      if (!res.ok) return inlineMessage(msg, res.error);
      setUi(target.revisionId, "editRubric", false);
      toast("Rubric check recorded.");
      app.rerender({ focus: "#sec-check" });
    } }, "Record rubric check"));
}

function rubricSummary(lesson, a) {
  const crit = new Map(lesson.rubric.map(r => [r.id, r]));
  const open = a.rubricChecks.filter(c => crit.get(c.criterionId) && crit.get(c.criterionId).critical && c.result !== "met");
  return h("div", { class: "card stack" },
    h("p", { class: "small muted" }, "Your manual check of this revision:"),
    h("ul", { class: "list" }, a.rubricChecks.map(c => {
      const r = crit.get(c.criterionId);
      return h("li", { class: "list-item" },
        h("span", { class: "row" }, h("strong", null, r ? r.label : c.criterionId), r && r.critical ? h("span", { class: "chip bad" }, "Critical") : null, resultChip(c.result)),
        c.evidenceText ? h("span", { class: "small" }, c.evidenceText) : h("span", { class: "small muted" }, "No note"));
    })),
    open.length ? h("p", { class: "banner warn" }, h("strong", null, "Critical criteria not yet met: "), open.map(c => crit.get(c.criterionId).label).join(", "), ". These stay visible rather than being averaged away.") : null);
}

function calibration(a) {
  const pa = a.preAttempt || {};
  const counts = { met: 0, needs_work: 0, uncertain: 0 };
  a.rubricChecks.forEach(c => counts[c.result]++);
  return h("p", { class: "notice" },
    h("strong", null, "Before and after: "),
    `before attempting you recorded ${pa.confidence ? `confidence ${pa.confidence}/5` : "no confidence rating"}${pa.predictedDifficulty ? ` and expected “${pa.predictedDifficulty}” to be hardest` : ""}. `,
    `Your own check: ${counts.met} met, ${counts.needs_work} needs work, ${counts.uncertain} uncertain. `,
    "Compare these yourself; the app draws no score from them.");
}

// 5 — Feedback with visible provenance, and the learner's response to each item.
function sectionFeedback(ctx) {
  const { app, lesson, target } = ctx;
  if (!target) return section("sec-feedback", 5, "Feedback and your response", false, lockedNote(ctx, "Feedback and responses"));
  const info = deriveRevision(target, lesson);
  const items = target.feedback.filter(f => f.revisionId === target.revisionId);
  const children = [];
  children.push(h("p", null, "Each feedback item keeps its source. Respond to at least one: accept it, reject it with a reason, or amend it. AI feedback stays unverified even after you agree with it."));
  if (!info.flags.self_checked) children.push(h("p", { class: "small muted" }, "Tip: record your own rubric check first. The Reviewed state needs both your rubric check and a feedback response."));
  if (!items.length) children.push(h("p", { class: "locked-note" }, "No feedback yet. Add some below."));
  for (const fb of items) children.push(feedbackItem(ctx, fb));
  children.push(addFeedbackPanels(ctx));
  return section("sec-feedback", 5, "Feedback and your response", info.flags.reviewed, children);
}

function feedbackItem({ app, lesson, target }, fb) {
  const store = app.store;
  const box = h("div", { class: "feedback-item stack" },
    h("div", { class: "row" }, provenanceChip(fb.provenance), fb.sourceLabel ? h("span", { class: "chip outline" }, fb.sourceLabel) : null, fb.createdAt ? h("span", { class: "small muted" }, formatTime(fb.createdAt)) : null),
    pre(fb.text));
  if (fb.provenance === "external_ai_unverified") box.appendChild(h("p", { class: "small muted" }, "Pasted from an external AI tool. It is advisory and can be wrong; check it against the case."));
  if (fb.criterionReviews && fb.criterionReviews.length) {
    box.appendChild(h("details", { class: "disclosure" },
      h("summary", null, `Advisory results for ${fb.criterionReviews.length} criteria — not your rubric check`),
      h("div", { class: "body" }, h("ul", { class: "list" }, fb.criterionReviews.map(r => {
        const c = lesson.rubric.find(x => x.id === r.criterionId);
        return h("li", { class: "list-item" }, h("span", { class: "row" }, h("strong", null, c ? c.label : r.criterionId), h("span", { class: "chip outline" }, REVIEW_LABEL[r.result])), r.evidenceText ? h("span", { class: "small" }, r.evidenceText) : null);
      })))));
  }
  const editing = getUi(fb.id, "edit");
  if (fb.learnerResponse && !editing) {
    box.appendChild(h("div", { class: "notice" }, h("strong", null, `Your response (${fb.responseDecision || "recorded"}): `), fb.learnerResponse));
    box.appendChild(h("button", { type: "button", class: "link", onclick: () => { setUi(fb.id, "edit", true); app.rerender({ keepScroll: true }); } }, "Change response"));
    return box;
  }
  const key = `resp-${fb.id}`;
  const draft = { decision: fb.responseDecision, text: fb.learnerResponse || "", drillTag: fb.drillTag || "", ...(M.getReviewDraft(store.data, lesson.id, target.revisionId, key) || {}) };
  const save = () => store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, key, draft));
  const msg = h("div");
  const drillOptions = [["", "No drill"], ...lesson.rubric.map(r => [r.errorTag, `${r.label} → ${errorLabel(app, r.errorTag)}`])].filter((x, i, arr) => arr.findIndex(y => y[0] === x[0]) === i);
  const select = h("select", { onchange: () => { draft.drillTag = select.value; save(); } }, drillOptions.map(([v, l]) => h("option", { value: v }, l)));
  select.value = draft.drillTag || "";
  box.appendChild(pills(`dec-${fb.id}`, [["accept", "Accept"], ["reject", "Reject"], ["amend", "Amend"]], draft.decision, v => { draft.decision = v; save(); }, "Your decision"));
  box.appendChild(textField({ label: "Your response — what you will change, or why you disagree", long: true, short: true, value: draft.text, onInput: v => { draft.text = v; save(); } }));
  if (fb.provenance !== "authored_choice_key") box.appendChild(h("label", { class: "field" }, h("span", { class: "field-label" }, "Act on this with a targeted drill? (optional)"), select));
  box.appendChild(msg);
  box.appendChild(h("button", { type: "button", class: "primary", onclick: () => {
    const res = store.update(pp => {
      const r = M.respondToFeedback(pp, lesson, target, fb.id, draft);
      if (r.ok) { const f = target.feedback.find(x => x.id === fb.id); if (draft.drillTag) f.drillTag = draft.drillTag; else delete f.drillTag; }
      return r;
    }, { immediate: true });
    if (!res.ok) return inlineMessage(msg, res.error);
    setUi(fb.id, "edit", false);
    toast("Response recorded.");
    app.rerender({ keepScroll: true });
  } }, "Record response"));
  return box;
}

function errorLabel(app, tag) {
  const e = app.content.errors.get(tag);
  return e ? e.label : tag;
}

function modelAnswerSeen(p, lesson) {
  return attemptsForLesson(p, lesson.id).some(a => a.events.some(e => e.type === "model_answer_revealed"));
}

function addFeedbackPanels(ctx) {
  const { app, lesson, target } = ctx;
  const store = app.store;
  const wrap = h("div", { class: "stack" }, h("h3", null, "Add feedback"));

  // a) Self-review against the example answer.
  {
    const seen = modelAnswerSeen(store.data, lesson);
    const msg = h("div");
    const body = h("div", { class: "body stack" });
    if (!seen) {
      body.appendChild(h("p", null, "Reveal the example answer and write what differs. Revealing it is recorded as assistance; it never advances your state."));
      body.appendChild(h("button", { type: "button", onclick: () => { store.update(pp => M.revealModelAnswer(pp, lesson), { immediate: true }); setUi("panel", "self", true); app.rerender({ keepScroll: true }); } }, "Reveal the example answer"));
    } else {
      body.appendChild(h("div", { class: "card tight" }, renderMarkdown(lesson.modelAnswer)));
      body.appendChild(h("p", { class: "small muted" }, "One defensible approach. Equivalent answers that meet the rubric are valid."));
      let text = M.getReviewDraft(store.data, lesson.id, target.revisionId, "selfReview") || "";
      body.appendChild(textField({ label: "What does the example do that your attempt does not — or the reverse?", long: true, value: text,
        onInput: v => { text = v; store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "selfReview", v)); } }));
      body.appendChild(msg);
      body.appendChild(h("button", { type: "button", class: "primary", onclick: () => {
        const res = store.update(pp => M.addFeedback(pp, lesson, target, { provenance: "self_review", text, sourceLabel: "Comparison with the example answer" }), { immediate: true });
        if (!res.ok) return inlineMessage(msg, res.error);
        store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "selfReview", ""));
        toast("Self-review added. Now record your response to it.");
        app.rerender({ keepScroll: true });
      } }, "Add as self-review"));
    }
    wrap.appendChild(h("details", { class: "disclosure", open: getUi("panel", "self") || undefined, ontoggle: e => setUi("panel", "self", e.target.open) },
      h("summary", null, "Compare with the example answer (self-review)"), body));
  }

  // b) External AI review through a packet the learner copies.
  {
    const packet = buildReviewPacket(lesson, target);
    const area = h("textarea", { class: "code", readonly: true, "aria-label": "Review packet text" });
    area.value = packet;
    const copyMsg = h("div");
    const msg = h("div");
    let pasted = M.getReviewDraft(store.data, lesson.id, target.revisionId, "external") || "";
    let source = M.getReviewDraft(store.data, lesson.id, target.revisionId, "externalSource") || "";
    const body = h("div", { class: "body stack" },
      h("p", null, "Optional. This is exactly what will be copied: the case, the task, your submitted attempt and the rubric. Your confidence notes, other lessons and drafts are not included. Nothing is sent by this app — you paste it into an AI tool you choose."),
      area,
      copyMsg,
      h("div", { class: "row" },
        h("button", { type: "button", onclick: async () => {
          const ok = await copyText(packet);
          if (ok) inlineMessage(copyMsg, "Copied. Paste it into your AI tool, then paste its answer below.", "info");
          else { inlineMessage(copyMsg, "Copying is blocked here. Tap in the box above, select all of the text and copy it manually.", "warn"); area.focus(); area.select(); }
        } }, "Copy packet"),
        h("button", { type: "button", onclick: () => { area.focus(); area.select(); } }, "Select text")),
      textField({ label: "Paste the AI tool’s response", long: true, value: pasted, onInput: v => { pasted = v; store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "external", v)); } }),
      textField({ label: "Which tool? (optional)", value: source, placeholder: "e.g. the chat app you used", onInput: v => { source = v; store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "externalSource", v)); } }),
      h("p", { class: "small muted" }, "Saved as “External AI review — unverified”. Lines in the requested “criterion | result | evidence” format are kept as advisory results; they never fill in your own rubric check."),
      msg,
      h("button", { type: "button", class: "primary", onclick: () => {
        const reviews = parseCriterionLines(pasted, lesson);
        const res = store.update(pp => M.addFeedback(pp, lesson, target, { provenance: "external_ai_unverified", text: pasted, criterionReviews: reviews, sourceLabel: source || undefined }), { immediate: true });
        if (!res.ok) return inlineMessage(msg, res.error);
        store.update(pp => { M.setReviewDraft(pp, lesson, target.revisionId, "external", ""); });
        toast(reviews.length ? `Saved. ${reviews.length} advisory criterion result(s) recognised.` : "Saved as free text (no criterion lines recognised).");
        app.rerender({ keepScroll: true });
      } }, "Save pasted review"));
    wrap.appendChild(h("details", { class: "disclosure", open: getUi("panel", "ext") || undefined, ontoggle: e => setUi("panel", "ext", e.target.open) },
      h("summary", null, "External AI review (optional)"), body));
  }

  // c) Feedback from a person.
  {
    const msg = h("div");
    let text = M.getReviewDraft(store.data, lesson.id, target.revisionId, "human") || "";
    let who = "";
    const body = h("div", { class: "body stack" },
      textField({ label: "Who gave it? (optional)", value: "", onInput: v => { who = v; } }),
      textField({ label: "Their feedback", long: true, value: text, onInput: v => { text = v; store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "human", v)); } }),
      msg,
      h("button", { type: "button", class: "primary", onclick: () => {
        const res = store.update(pp => M.addFeedback(pp, lesson, target, { provenance: "human_review", text, sourceLabel: who || undefined }), { immediate: true });
        if (!res.ok) return inlineMessage(msg, res.error);
        store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "human", ""));
        app.rerender({ keepScroll: true });
      } }, "Save feedback"));
    wrap.appendChild(h("details", { class: "disclosure", open: getUi("panel", "human") || undefined, ontoggle: e => setUi("panel", "human", e.target.open) },
      h("summary", null, "Feedback from a person"), body));
  }
  return wrap;
}

// 6 — One targeted drill at a time, with the evidence that suggested it.
export function drillCandidates(app, lesson, a) {
  const out = [];
  const add = (tag, why) => { if (app.content.errors.has(tag) && !out.some(c => c.tag === tag)) out.push({ tag, why }); };
  for (const fb of a.feedback.filter(f => f.choiceCheck)) {
    const field = lesson.task.fields.find(f => f.id === fb.choiceCheck.fieldId);
    for (const id of fb.choiceCheck.missed) {
      const o = field && field.options.find(x => x.id === id);
      if (o && o.errorTag) add(o.errorTag, `Answer key: you did not select “${o.label}”.`);
    }
  }
  const crit = lesson.rubric.slice().sort((x, y) => (y.critical ? 1 : 0) - (x.critical ? 1 : 0));
  for (const r of crit) {
    const c = a.rubricChecks.find(x => x.criterionId === r.id);
    if (c && c.result === "needs_work") add(r.errorTag, `Your rubric check: “${r.label}” needs work.`);
  }
  for (const f of a.feedback) if (f.drillTag && f.learnerResponse) add(f.drillTag, `You chose to act on ${f.provenance === "external_ai_unverified" ? "external AI feedback (still unverified)" : "feedback"}.`);
  return out;
}

function sectionPractice(ctx) {
  const { app, lesson, target } = ctx;
  if (!target) return section("sec-practice", 6, "Targeted practice", false, lockedNote(ctx, "Targeted drills"));
  const store = app.store;
  const cands = drillCandidates(app, lesson, target);
  const extra = target.feedback.filter(f => f.choiceCheck && f.choiceCheck.extra.length);
  const chosenTag = getUi(target.revisionId, "drill") || (cands[0] && cands[0].tag) || null;
  const children = [];
  children.push(h("p", null, "A short exercise on one specific gap — suggested only from your answer-key result, your own rubric observations, or feedback you chose to act on. Completing a drill does not change your evidence state."));
  if (extra.length) children.push(h("p", { class: "notice" }, "You marked a supplied fact as unsafe. Compare it with the enquiry and the facts: a supplied request can be stated; only claims the case does not support need checking."));
  if (!cands.length) children.push(h("p", { class: "locked-note" }, "No drill is suggested yet: there is no recorded observation pointing to one. You can still choose any drill."));

  const all = [...app.content.errors.values()];
  const select = h("select", { "aria-label": "Choose a drill", onchange: () => { setUi(target.revisionId, "drill", select.value || null); app.rerender({ keepScroll: true }); } },
    h("option", { value: "" }, cands.length ? "Suggested drill" : "Choose a drill…"),
    cands.length ? h("optgroup", { label: "Suggested from your evidence" }, cands.map(c => h("option", { value: c.tag }, errorLabel(app, c.tag)))) : null,
    h("optgroup", { label: "All drills" }, all.map(e => h("option", { value: e.id }, `${e.drill.title} (${e.label})`))));
  select.value = getUi(target.revisionId, "drill") || "";
  if (chosenTag) {
    const err = app.content.errors.get(chosenTag);
    const why = cands.find(c => c.tag === chosenTag);
    children.push(drillCard(ctx, err, why ? why.why : "You chose this drill."));
  }
  children.push(h("label", { class: "field" }, h("span", { class: "field-label" }, cands.length > 1 ? `Other drills (${cands.length - 1} more suggested)` : "Choose a different drill"), select));
  const done = (target.drills || []);
  if (done.length) {
    children.push(h("h3", null, "Drills done for this revision"));
    children.push(h("ul", { class: "list" }, done.map(d => {
      const e = all.find(x => x.drill.id === d.drillId);
      return h("li", { class: "list-item" }, h("span", { class: "row" }, h("strong", null, e ? e.drill.title : d.drillId), resultChip(d.selfCheck.result)), pre(d.response, "small"));
    })));
  }
  return section("sec-practice", 6, "Targeted practice", done.length > 0, children);
}

function drillCard({ app, lesson, target }, err, why) {
  const store = app.store;
  const d = err.drill;
  const key = `drill-${d.id}`;
  const draft = { response: "", result: null, note: "", ...(M.getReviewDraft(store.data, lesson.id, target.revisionId, key) || {}) };
  const save = () => store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, key, draft));
  const msg = h("div");
  const hint = h("div");
  const check = h("div");
  return h("div", { class: "card stack" },
    h("p", { class: "eyebrow" }, `${err.label} · ${d.estimatedMinutes} min`),
    h("h3", null, d.title),
    h("p", { class: "small" }, h("strong", null, "Why this drill: "), why),
    h("p", { class: "small muted" }, err.observation),
    h("div", { class: "quote pre-text" }, d.scenario),
    h("p", null, d.instruction),
    hint,
    h("button", { type: "button", class: "link", onclick: () => { hint.textContent = ""; hint.appendChild(h("p", { class: "notice" }, h("strong", null, "Hint: "), d.hint)); } }, "Show hint"),
    textField({ label: "Your drill answer", long: true, value: draft.response, onInput: v => { draft.response = v; save(); } }),
    check,
    h("button", { type: "button", class: "link", onclick: () => { check.textContent = ""; check.appendChild(h("p", { class: "notice" }, h("strong", null, "Self-check: "), d.selfCheck)); } }, "Show the self-check"),
    pills(`dr-${target.revisionId}-${d.id}`, RESULTS, draft.result, v => { draft.result = v; save(); }, "Compared with the self-check, your answer is…"),
    textField({ label: "Note (optional)", long: true, short: true, value: draft.note, onInput: v => { draft.note = v; save(); } }),
    msg,
    h("button", { type: "button", class: "primary", onclick: () => {
      const res = store.update(pp => M.recordDrill(pp, lesson, target, { drillId: d.id, errorTag: err.id, trigger: why, ...draft }), { immediate: true });
      if (!res.ok) return inlineMessage(msg, res.error);
      store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, key, {}));
      toast("Drill saved.");
      app.rerender({ keepScroll: true });
    } }, "Save drill"));
}

// 7 — Transfer to a changed case, with its own check and evidence label.
function sectionTransfer(ctx) {
  const { app, lesson, target } = ctx;
  if (!target) return section("sec-transfer", 7, `Transfer: ${lesson.nextDrill.title}`, false, lockedNote(ctx, "Transfer attempts"), h("p", { class: "small muted" }, lesson.nextDrill.instruction));
  const store = app.store;
  const info = deriveRevision(target, lesson);
  const draft = { text: "", evidenceKind: "fictional", result: null, evidenceText: "", ...(M.getReviewDraft(store.data, lesson.id, target.revisionId, "transfer") || {}) };
  const save = () => store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "transfer", draft));
  const msg = h("div");
  const past = target.events.filter(e => e.type === "transfer_checked");
  const children = [
    h("p", null, "Apply what you changed to a case where a relevant condition is different. This is separate from your original submission and gets its own check."),
    h("div", { class: "card tight" }, h("p", null, lesson.nextDrill.instruction)),
    textField({ label: "Your transfer attempt", long: true, value: draft.text, onInput: v => { draft.text = v; save(); } }),
    pills(`tk-${target.revisionId}`, [["fictional", "Fictional"], ["simulated", "Simulated"], ["live", "Live"]], draft.evidenceKind, v => { draft.evidenceKind = v; save(); }, "What kind of evidence is this?"),
    h("p", { class: "small muted" }, "Fictional: a written answer to an invented case. Simulated: you ran or hand-simulated a prompt or workflow on test inputs. Live: a real business system you are authorised to use. A simulation is never a completed live integration."),
    pills(`tr-${target.revisionId}`, RESULTS, draft.result, v => { draft.result = v; save(); }, "Your check of the transfer attempt"),
    textField({ label: "What did you compare it against?", long: true, short: true, value: draft.evidenceText, onInput: v => { draft.evidenceText = v; save(); } }),
    msg,
    h("button", { type: "button", class: "primary btn-block", onclick: () => {
      if (draft.evidenceKind === "live" && !confirm("Label this as LIVE evidence from a real system you are authorised to use? Fictional or simulated work must not be labelled live.")) return;
      const res = store.update(pp => M.submitTransfer(pp, lesson, target, draft), { immediate: true });
      if (!res.ok) return inlineMessage(msg, res.error);
      store.update(pp => M.setReviewDraft(pp, lesson, target.revisionId, "transfer", {}));
      toast("Transfer attempt and check recorded.");
      app.rerender({ focus: "#sec-transfer" });
    } }, "Submit transfer attempt")
  ];
  if (!info.flags.reviewed) children.splice(1, 0, h("p", { class: "small muted" }, "Applied needs the earlier steps too: a rubric check and a feedback response on this revision."));
  if (past.length) {
    children.push(h("h3", null, "Transfer attempts for this revision"));
    children.push(h("ul", { class: "list" }, past.map(e => h("li", { class: "list-item" },
      h("span", { class: "row" }, h("span", { class: "chip outline" }, e.evidence.evidenceKind), resultChip(e.evidence.transferCheck.result), h("span", { class: "small muted" }, formatTime(e.createdAt))),
      pre(e.evidence.transferSubmission, "small"),
      h("span", { class: "small muted" }, `Check: ${e.evidence.transferCheck.evidenceText}`)))));
  }
  return section("sec-transfer", 7, `Transfer: ${lesson.nextDrill.title}`, info.flags.applied, children);
}

function sectionReflection({ app, lesson }) {
  const store = app.store;
  const note = store.data.notes.find(n => n.kind === "reflection" && n.lessonId === lesson.id);
  return section("sec-reflect", 8, "Reflection", !!(note && note.text.trim()),
    h("p", null, lesson.reflection),
    textField({ label: "Your reflection (saved as a note)", long: true, value: note ? note.text : "",
      onInput: v => store.update(pp => M.upsertNote(pp, { text: v, lessonId: lesson.id, kind: "reflection" })) }));
}

function sectionAnswer({ app, lesson }) {
  const store = app.store;
  const seen = modelAnswerSeen(store.data, lesson);
  const box = h("section", { class: "section", id: "sec-answer", tabindex: "-1" }, h("h2", null, "Example answer"));
  if (seen) {
    box.appendChild(h("div", { class: "card" }, renderMarkdown(lesson.modelAnswer)));
    box.appendChild(h("p", { class: "small muted" }, "Authored example content — one defensible approach, never your work and not an observed model run."));
  } else {
    box.appendChild(h("p", { class: "muted" }, "Available any time. If you reveal it before submitting, that revision is labelled guided practice. It never advances your evidence state."));
    box.appendChild(h("button", { type: "button", onclick: () => {
      if (!confirm("Reveal the example answer? This is recorded as assistance.")) return;
      store.update(pp => M.revealModelAnswer(pp, lesson), { immediate: true });
      app.rerender({ focus: "#sec-answer" });
    } }, "Reveal example answer"));
  }
  return box;
}

function sectionHistory({ app, lesson, st }) {
  const box = h("section", { class: "section", id: "sec-history", tabindex: "-1" }, h("h2", null, "Revision history"));
  const revs = orderedRevisions(app.store.data, lesson.id);
  if (!revs.length) { box.appendChild(h("p", { class: "muted" }, "Nothing yet.")); return box; }
  box.appendChild(h("ul", { class: "list" }, revs.map(a => {
    const info = deriveRevision(a, a.contentVersion === lesson.contentVersion ? lesson : null);
    const n = a.submittedAt ? `Revision ${revisionNumber(st, a)}` : "Draft revision";
    return h("li", null, h("a", { class: "list-item", href: `#/work/attempt/${encodeURIComponent(a.id)}` },
      h("span", { class: "title" }, n),
      h("span", { class: "meta" }, stateChip(info.state), a.submittedAt ? `submitted ${formatTime(a.submittedAt)}` : "not submitted", `content v${a.contentVersion}`, info.guided ? h("span", { class: "chip warn" }, "Guided practice") : null)));
  })));
  box.appendChild(h("h3", null, "Sources"));
  box.appendChild(h("ul", { class: "small" }, lesson.sources.map(s => h("li", null, s.label))));
  return box;
}

// Per-session view state (open panels, which drill is chosen). Not saved.
const uiState = new Map();
function getUi(id, k) { return uiState.get(`${id}:${k}`); }
function setUi(id, k, v) { uiState.set(`${id}:${k}`, v); }
