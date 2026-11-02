import { h } from "../dom.js";
import { lessonStatus, nextAction } from "../evidence.js";
import { getDraft, missionSkipped } from "../model.js";
import { stateChip, modeChip } from "../ui.js";
import { formatTime } from "../util.js";

function lastActivity(p, lessonId) {
  const times = p.attempts.filter(a => a.lessonId === lessonId).flatMap(a => a.events.map(e => e.createdAt));
  const d = getDraft(p, lessonId);
  if (d && Object.keys(d.values || {}).length) times.push(d.updatedAt);
  return times.sort().pop() || "";
}

// The active mission: the most recently touched lesson that still has a next step,
// otherwise the first mission in course order that has not been applied or skipped.
export function pickActive(app) {
  const { content, store } = app;
  const p = store.data;
  let best = null;
  for (const id of content.lessonOrder) {
    const lesson = content.lessons.get(id);
    const st = lessonStatus(p, lesson);
    const t = lastActivity(p, id);
    if (!t || missionSkipped(p, lesson.missionId)) continue;
    const act = nextAction(st);
    if (act.key === "done") continue;
    if (!best || t > best.t) best = { t, lesson, st, act };
  }
  if (best) return { kind: "lesson", ...best, resume: true };
  for (const mid of content.missionOrder) {
    if (missionSkipped(p, mid)) continue;
    const lid = content.lessonByMission.get(mid);
    if (lid) {
      const lesson = content.lessons.get(lid);
      const st = lessonStatus(p, lesson);
      if (st.state === "applied") continue;
      return { kind: "lesson", lesson, st, act: nextAction(st), resume: false };
    }
    return { kind: "outline", mission: content.missions.get(mid) };
  }
  return { kind: "none" };
}

export function renderToday(app) {
  const { content, store } = app;
  const p = store.data;
  const meta = store.meta;
  const view = h("div", { class: "stack-lg", "data-title": "Today" });
  view.dataset.title = "Today";

  view.appendChild(h("div", null,
    h("p", { class: "eyebrow" }, "Today"),
    h("h1", null, "One useful next step")));

  if (!meta.introDismissed) {
    view.appendChild(h("div", { class: "card stack" },
      h("h2", null, "How this works"),
      h("p", null, "You already use AI tools. Each lesson asks you to do a small piece of real work first, then check it against clear criteria, get feedback, practise one specific gap and try a changed case."),
      h("p", null, "The app records what you did — seen, attempted, self-checked, reviewed, applied. These describe activity, not grades or a skill score. Nothing here certifies expertise."),
      h("p", null, h("strong", null, "Saving: "), "your work is saved only in this browser on this device. It does not sync between your phone and tablet. Use Backup to export a copy you can keep or move."),
      h("div", { class: "actions" }, h("button", { type: "button", onclick: () => { store.updateMeta({ introDismissed: true }); app.rerender(); } }, "Got it"))));
  }

  const active = pickActive(app);
  if (active.kind === "lesson") {
    const { lesson, st, act } = active;
    const mission = content.missions.get(lesson.missionId);
    view.appendChild(h("div", { class: "card accent stack" },
      h("div", { class: "row" },
        h("span", { class: "eyebrow" }, `${lesson.missionId} · ${lesson.id}`),
        stateChip(st.state),
        st.revisionCount > 1 ? h("span", { class: "chip outline" }, `Revision ${st.revisionCount}`) : null),
      h("h2", null, lesson.title),
      h("p", null, lesson.objective),
      h("p", { class: "muted small" }, `${lesson.estimatedMinutes} min core exercise · ${mission ? mission.activeMinutes : "?"} min for the whole mission`),
      h("p", null, h("strong", null, "Next: "), act.text),
      h("div", { class: "actions" },
        h("a", { class: "btn primary btn-block", href: `#/lesson/${lesson.id}` }, active.resume ? "Continue" : (st.state ? "Open lesson" : "Start")))));
  } else if (active.kind === "outline") {
    const m = active.mission;
    view.appendChild(h("div", { class: "card stack" },
      h("div", { class: "row" }, h("span", { class: "eyebrow" }, m.id), h("span", { class: "chip outline" }, "Outline"), modeChip(m.mode)),
      h("h2", null, m.title),
      h("p", null, m.practice),
      h("p", { class: "muted small" }, "This mission is an outline. It is not yet written as an interactive lesson, so the app does not track evidence states for it. You can keep notes on it."),
      h("div", { class: "actions" }, h("a", { class: "btn primary btn-block", href: `#/mission/${m.id}` }, "Open outline"))));
  } else {
    view.appendChild(h("div", { class: "card" }, h("p", null, "Every interactive lesson has an applied revision or was skipped. Browse the Course to repeat one or work on an outline.")));
  }

  // Offer one export after the first substantive submitted attempt.
  const submitted = p.attempts.filter(a => a.submittedAt).length;
  if (submitted > 0 && !meta.lastExportAt && !meta.backupOfferDismissed) {
    view.appendChild(h("div", { class: "card stack" },
      h("h3", null, "Keep a copy of your first attempt"),
      h("p", null, "It is saved in this browser only. Clearing site data, a different browser or another device will not have it. An export is a file you keep — it is not cloud sync."),
      h("div", { class: "actions" },
        h("a", { class: "btn primary", href: "#/settings/export" }, "Export a backup"),
        h("button", { type: "button", onclick: () => { store.updateMeta({ backupOfferDismissed: true }); app.rerender(); } }, "Not now"))));
  }

  // Recently touched lessons.
  const recent = content.lessonOrder
    .map(id => ({ lesson: content.lessons.get(id), t: lastActivity(p, id) }))
    .filter(x => x.t && !(active.kind === "lesson" && x.lesson.id === active.lesson.id))
    .sort((a, b) => b.t.localeCompare(a.t)).slice(0, 3);
  if (recent.length) {
    view.appendChild(h("div", null,
      h("h3", null, "Recent"),
      h("ul", { class: "list" },
        recent.map(({ lesson, t }) => {
          const st = lessonStatus(p, lesson);
          return h("li", null, h("a", { class: "list-item", href: `#/lesson/${lesson.id}` },
            h("span", { class: "title" }, `${lesson.id} · ${lesson.title}`),
            h("span", { class: "meta" }, stateChip(st.state), `Last activity ${formatTime(t)}`)));
        }))));
  }

  view.appendChild(h("details", { class: "disclosure" },
    h("summary", null, "A flexible week (6–8 hours)"),
    h("div", { class: "body stack small" },
      h("p", null, "One seven-hour example: 90 minutes of short lessons and drills, 150 minutes of practical workflow work, 90 minutes of discovery or observation, 60 minutes of review and documentation, and 30 minutes of buffer. Split it into sessions that fit."),
      h("p", null, "A light week can keep one attempt, one check and one small next action. The six-module plan is a suggested sequence, not a deadline, and it does not promise a first client."),
      h("p", { class: "muted" }, "The app sets no reminders, streaks or deadlines."))));

  view.appendChild(h("p", { class: "muted small" },
    `${store.status.kind === "saved" ? "Saved on this browser" : store.status.kind === "idle" ? "Nothing saved on this browser yet" : "Not saved — see the message above"}${store.status.lastSavedAt ? ` · last saved ${formatTime(store.status.lastSavedAt)}` : ""} · last export: ${meta.lastExportAt ? formatTime(meta.lastExportAt) : "never"}`));
  return view;
}
