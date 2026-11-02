import { h } from "../dom.js";
import { lessonStatus } from "../evidence.js";
import { MODE_INFO, briefsForMission, readingsForMission } from "../content.js";
import { missionSkipped, markMission, upsertNote } from "../model.js";
import { stateChip, modeChip, textField, externalLink, toast } from "../ui.js";

export function renderCourse(app) {
  const { content, store } = app;
  const p = store.data;
  const view = h("div", { class: "stack" });
  view.dataset.title = "Course";
  const outlines = content.missionOrder.length - content.lessonByMission.size;
  view.appendChild(h("div", null,
    h("p", { class: "eyebrow" }, "Course"),
    h("h1", null, "Six modules, 28 missions"),
    h("p", { class: "muted" }, `${content.lessonByMission.size} missions have an interactive lesson; ${outlines} are outlines that are not yet written as lessons. Everything is open — recommended order is a suggestion, not a lock.`)));

  view.appendChild(h("p", { class: "small muted" },
    "Built around Dan Martell’s AI Company Operating System Playbook (Audit → Build → Test → Scale, RCCF, the Camcorder Method, the Buyback Loop). Exercises, cases and rubrics are original app material; this is not an official Dan Martell product."));

  for (const mod of content.modules) {
    const guided = mod.missions.reduce((n, m) => n + m.activeMinutes, 0);
    const section = h("section", { class: "module", "aria-labelledby": `mod-${mod.id}` },
      h("div", { class: "module-head stack" },
        h("p", { class: "eyebrow" }, `${mod.id} · ${guided} min guided${mod.additionalPractice ? ` + ${mod.additionalPractice.minutes} min project practice` : ""}`),
        h("h2", { id: `mod-${mod.id}` }, mod.title),
        h("p", { class: "small muted" }, h("strong", null, "Framework: "), mod.frameworkConnection)));
    const list = h("ul", { class: "list" });
    for (const m of mod.missions) {
      const lessonId = content.lessonByMission.get(m.id);
      const lesson = lessonId ? content.lessons.get(lessonId) : null;
      const skipped = missionSkipped(p, m.id);
      const st = lesson ? lessonStatus(p, lesson) : null;
      list.appendChild(h("li", null, h("a", {
        class: `list-item ${lesson ? "" : "outline-item"}`,
        href: lesson ? `#/lesson/${lesson.id}` : `#/mission/${m.id}`
      },
        h("span", { class: "title" }, `${m.id} · ${lesson ? lesson.title : m.title}`),
        h("span", { class: "meta" },
          lesson ? h("span", { class: "chip info" }, `Lesson ${lesson.id}`) : h("span", { class: "chip outline" }, "Outline"),
          lesson ? stateChip(st.state) : null,
          skipped ? h("span", { class: "chip warn" }, "Skipped") : null,
          st && st.revisionCount > 1 ? h("span", { class: "chip outline" }, `${st.revisionCount} revisions`) : null,
          modeChip(m.mode),
          `${m.activeMinutes} min`))));
    }
    section.appendChild(list);
    if (mod.additionalPractice) section.appendChild(h("p", { class: "small muted" }, h("strong", null, "Project practice: "), mod.additionalPractice.text));
    view.appendChild(section);
  }
  view.appendChild(h("p", { class: "small muted" }, "Completing missions produces a portfolio with explicit evidence status — not a certificate, a client, or proof of readiness to sell."));
  return view;
}

export function missionInfo(app, mission, { compact = false } = {}) {
  const { content } = app;
  const mode = MODE_INFO[mission.mode] || { label: mission.mode, detail: "" };
  const box = h("div", { class: "stack" });
  if (!compact || mission.mode !== "mobile") {
    box.appendChild(h("div", { class: mission.mode === "external" ? "banner warn" : "notice" },
      h("p", null, h("strong", null, compact ? `Mission ${mission.id} is ${mode.label.toLowerCase()}: ` : `${mode.label}: `), mode.detail,
        compact ? " This lesson itself works fully on a phone or tablet." : "")));
  }
  if (!compact) {
    box.appendChild(h("div", { class: "stack" },
      h("h3", null, "Practice"), h("p", null, mission.practice),
      h("h3", null, "Evidence"), h("p", null, mission.evidence),
      h("h3", null, "What a sound result looks like"), h("p", null, mission.acceptance)));
  }
  const briefs = briefsForMission(content, mission.id);
  if (briefs.length) {
    box.appendChild(h("details", { class: "disclosure" },
      h("summary", null, `Planned practice brief${briefs.length > 1 ? "s" : ""} (${briefs.map(b => b.id).join(", ")})`),
      h("div", { class: "body stack small" },
        h("p", { class: "muted" }, "Planned content-authoring notes, not finished lessons. Reading them does not record an attempt or any evidence state."),
        briefs.map(b => h("div", null,
          h("p", null, h("strong", null, `${b.id} — ${b.title}`), " ", h("span", { class: "chip outline" }, "Planned")),
          h("p", null, b.purpose),
          h("p", { class: "muted" }, `Saved result when written: ${b.savedResult}`))),
        h("p", { class: "muted" }, "Full briefs: ", h("a", { href: "handoff/content/consulting-practice-backlog.md", target: "_blank", rel: "noopener" }, "consulting-practice-backlog.md")))));
  }
  const reads = readingsForMission(content, mission.id);
  if (reads.length) {
    box.appendChild(h("details", { class: "disclosure" },
      h("summary", null, "Optional reading"),
      h("div", { class: "body stack small" },
        h("p", { class: "muted" }, "Read only when it answers a question in your current task. It uses existing mission time and never gates progress. Links open another site."),
        reads.map(r => h("div", null, h("p", null, externalLink(r.url, r.label), ` [${r.id}]`), h("p", { class: "muted" }, r.question))))));
  }
  return box;
}

export function renderMission(app, missionId) {
  const { content, store } = app;
  const mission = content.missions.get(missionId);
  if (!mission) return h("div", { class: "stack" }, h("h1", null, "Mission not found"), h("a", { href: "#/course" }, "Back to Course"));
  const lessonId = content.lessonByMission.get(missionId);
  if (lessonId) { location.replace(`#/lesson/${lessonId}`); return h("div"); }
  const p = store.data;
  const mod = content.modules.find(m => m.id === mission.moduleId);
  const skipped = missionSkipped(p, missionId);
  const view = h("div", { class: "stack-lg" });
  view.dataset.title = mission.id;
  view.appendChild(h("div", { class: "stack" },
    h("a", { href: "#/course", class: "small" }, "← Course"),
    h("p", { class: "eyebrow" }, `${mission.id} · ${mod ? mod.title : mission.moduleId}`),
    h("h1", null, mission.title),
    h("div", { class: "row" }, h("span", { class: "chip outline" }, "Outline"), modeChip(mission.mode), h("span", { class: "chip outline" }, `${mission.activeMinutes} min`), skipped ? h("span", { class: "chip warn" }, "Skipped") : null),
    h("p", { class: "notice" }, "This mission is an outline. It has not been written as an interactive lesson, so there is no case, rubric or evidence state here yet. You can still do the practice outside the app and keep notes below.")));
  view.appendChild(missionInfo(app, mission));

  const note = p.notes.find(n => n.kind === "mission" && n.missionId === missionId);
  view.appendChild(h("div", { class: "card stack" },
    textField({
      label: "Your notes for this mission", long: true, value: note ? note.text : "",
      help: "Saved on this browser. Notes are not an evidence state.",
      onInput: v => store.update(pp => upsertNote(pp, { text: v, missionId, kind: "mission" }))
    })));

  view.appendChild(h("div", { class: "actions" },
    skipped
      ? h("button", { type: "button", onclick: () => { store.update(pp => markMission(pp, missionId, "unskipped"), { immediate: true }); app.rerender({ keepScroll: true }); } }, "Un-skip this mission")
      : h("button", { type: "button", onclick: () => { store.update(pp => markMission(pp, missionId, "skipped"), { immediate: true }); toast("Marked as skipped — not passed."); app.rerender({ keepScroll: true }); } }, "Skip this mission")));
  return view;
}
