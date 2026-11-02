// Evidence states are derived from the events and records of one revision. A stored
// or imported `state` label is never trusted on its own.

import { isBlank } from "./util.js";

export const STATES = ["seen", "attempted", "self_checked", "reviewed", "applied"];

export const STATE_INFO = {
  none: { label: "Not opened", short: "Not opened" },
  seen: { label: "Seen", short: "Seen", evidence: "You opened the lesson." },
  attempted: { label: "Attempted", short: "Attempted", evidence: "You submitted an attempt snapshot." },
  self_checked: { label: "Self-checked", short: "Self-checked", evidence: "You recorded a rubric check with notes against that snapshot." },
  reviewed: { label: "Reviewed", short: "Reviewed", evidence: "You inspected feedback and recorded a response." },
  applied: { label: "Applied", short: "Applied", evidence: "You submitted a separate transfer task and recorded its check." }
};

function hasSubmission(attempt) {
  return !!attempt.submittedAt && attempt.submission && Object.values(attempt.submission).some(v => !isBlank(v));
}

// Returns which activities are evidenced for this revision and the resulting state.
export function deriveRevision(attempt, lesson) {
  const rev = attempt.revisionId;
  const events = (attempt.events || []).filter(e => e.revisionId === rev);
  const has = type => events.some(e => e.type === type);

  const opened = has("opened") || has("submitted");
  const submitted = has("submitted") && hasSubmission(attempt);

  const checks = (attempt.rubricChecks || []).filter(r => r.revisionId === rev);
  const criterionIds = lesson ? lesson.rubric.map(r => r.id) : [...new Set(checks.map(r => r.criterionId))];
  const checkedAll = criterionIds.length > 0 && criterionIds.every(id => checks.some(r => r.criterionId === id));
  const hasNotes = checks.some(r => !isBlank(r.evidenceText));
  const selfChecked = submitted && has("rubric_recorded") && checkedAll && hasNotes;

  const responded = events.filter(e => e.type === "feedback_responded").some(e => {
    const fb = (attempt.feedback || []).find(f => f.id === (e.evidence && e.evidence.feedbackId));
    return fb && fb.revisionId === rev && !isBlank(fb.learnerResponse);
  });
  const reviewed = selfChecked && responded;

  const transfer = events.filter(e => e.type === "transfer_checked").some(e => {
    const ev = e.evidence || {};
    return !isBlank(ev.transferSubmission) && ev.transferCheck && ["met", "needs_work", "uncertain"].includes(ev.transferCheck.result)
      && ["fictional", "simulated", "live"].includes(ev.evidenceKind);
  });
  const applied = reviewed && transfer;

  const flags = { seen: opened, attempted: submitted, self_checked: selfChecked, reviewed, applied };
  let state = opened ? "seen" : null;
  for (const s of STATES) {
    if (flags[s]) state = s; else if (s !== "seen") break;
  }
  if (submitted && state === null) state = "attempted";

  const modelAnswerEvents = events.filter(e => e.type === "model_answer_revealed" || e.type === "guided_practice_started");
  const guided = !!attempt.submittedAt && modelAnswerEvents.some(e => e.createdAt <= attempt.submittedAt);
  const hintsUsed = events.filter(e => e.type === "hint_revealed").length;
  const skipped = has("skipped") && !submitted;

  return {
    state, flags, guided, hintsUsed, skipped,
    pending: {
      // Activities that exist but are not yet enough for the next state, so the
      // interface can say exactly what is missing.
      rubricIncomplete: submitted && !selfChecked,
      feedbackUnanswered: (attempt.feedback || []).some(f => f.revisionId === rev && isBlank(f.learnerResponse)),
      transferMissing: !transfer
    }
  };
}

export function attemptsForLesson(progress, lessonId) {
  return progress.attempts.filter(a => a.lessonId === lessonId);
}

// Order revisions by their supersedes chain, falling back to creation time.
export function orderedRevisions(progress, lessonId) {
  return attemptsForLesson(progress, lessonId).slice().sort((a, b) => revTime(a).localeCompare(revTime(b)));
}

function revTime(a) {
  const first = (a.events || []).map(e => e.createdAt).sort()[0];
  return a.submittedAt || first || "";
}

export function workingAttempt(progress, lessonId) {
  return attemptsForLesson(progress, lessonId).find(a => !a.submittedAt) || null;
}

export function latestSubmitted(progress, lessonId) {
  const subs = attemptsForLesson(progress, lessonId).filter(a => a.submittedAt);
  return subs.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt)).pop() || null;
}

// A lesson-level summary used by Today, Course and My Work.
export function lessonStatus(progress, lesson) {
  const revisions = orderedRevisions(progress, lesson.id);
  const active = latestSubmitted(progress, lesson.id);
  const working = workingAttempt(progress, lesson.id);
  const activeInfo = active ? deriveRevision(active, active.contentVersion === lesson.contentVersion ? lesson : null) : null;
  const workingInfo = working ? deriveRevision(working, lesson) : null;
  const skipped = !!(workingInfo && workingInfo.skipped) && !active;
  let state = activeInfo ? activeInfo.state : (workingInfo ? workingInfo.state : null);
  const outdated = !!active && active.contentVersion !== lesson.contentVersion;
  return { revisions, active, working, activeInfo, workingInfo, state, skipped, outdated, revisionCount: revisions.filter(r => r.submittedAt).length };
}

// The single next concrete action for a lesson, used on Today.
export function nextAction(status) {
  if (status.working) {
    return status.active
      ? { key: "attempt", text: "Finish and submit your revision." }
      : { key: "attempt", text: "Record your confidence, read the case, then write and submit your attempt." };
  }
  if (status.outdated) return { key: "fresh", text: "The exercise changed since your last attempt. Start a fresh attempt on the new version." };
  const info = status.activeInfo;
  if (!info) return { key: "start", text: "Record your confidence, read the case and make an attempt." };
  if (!info.flags.self_checked) return { key: "rubric", text: "Check your submitted attempt against the rubric." };
  if (!info.flags.reviewed) return { key: "feedback", text: "Gather feedback and record your response to it." };
  if (!info.flags.applied) return { key: "transfer", text: "Try the changed case and record its check." };
  return { key: "done", text: "This revision has a full evidence record. Repeat with a fresh attempt or move on." };
}
