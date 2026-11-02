// Content loading. Lessons, curriculum, drills and notes are data files; this module
// validates them and builds lookup tables. Nothing here renders or saves anything.

import { validateLessonBundle } from "./validate.js";

export const CONTENT_FILES = {
  bundles: ["content/starter-lessons.json", "content/applied-lessons.json"],
  curriculum: "content/curriculum.json",
  notes: "content/curriculum-notes.json",
  diagnostic: "content/diagnostic-map.json"
};

export async function loadContent(fetchJson) {
  const [starter, applied, curriculum, notes, diagnostic] = await Promise.all([
    fetchJson(CONTENT_FILES.bundles[0]),
    fetchJson(CONTENT_FILES.bundles[1]),
    fetchJson(CONTENT_FILES.curriculum),
    fetchJson(CONTENT_FILES.notes),
    fetchJson(CONTENT_FILES.diagnostic)
  ]);
  return buildContent({
    bundles: [{ name: "starter-lessons.json", data: starter }, { name: "applied-lessons.json", data: applied }],
    curriculum, notes, diagnostic
  });
}

// Bundles are combined by stable lesson ID in the order given. A bundle that fails
// validation is skipped as a whole; a duplicate ID is rejected and the first copy kept,
// so adding a later bundle can never replace L01–L03 or orphan saved work.
export function buildContent({ bundles, curriculum, notes, diagnostic }) {
  const problems = [];
  const lessons = new Map();
  const lessonSource = new Map();
  for (const { name, data } of bundles) {
    const issues = validateLessonBundle(data, name);
    if (issues.length) {
      problems.push(`${name} was not loaded: ${issues.slice(0, 3).join("; ")}${issues.length > 3 ? ` (+${issues.length - 3} more)` : ""}`);
      continue;
    }
    for (const lesson of data.lessons) {
      if (lessons.has(lesson.id)) {
        problems.push(`${name}: lesson ${lesson.id} duplicates an ID already loaded from ${lessonSource.get(lesson.id)}; the duplicate was rejected.`);
        continue;
      }
      lessons.set(lesson.id, lesson);
      lessonSource.set(lesson.id, name);
    }
  }

  const modules = (curriculum && curriculum.modules) || [];
  const missions = new Map();
  const missionOrder = [];
  for (const mod of modules) {
    for (const mission of mod.missions) {
      missions.set(mission.id, { ...mission, moduleId: mod.id });
      missionOrder.push(mission.id);
    }
  }
  const lessonByMission = new Map();
  for (const lesson of lessons.values()) {
    const mission = missions.get(lesson.missionId);
    if (!mission) problems.push(`Lesson ${lesson.id} refers to unknown mission ${lesson.missionId}.`);
    else if (mission.lessonId && mission.lessonId !== lesson.id) problems.push(`Mission ${lesson.missionId} expects ${mission.lessonId}, but ${lesson.id} claims it.`);
    else lessonByMission.set(lesson.missionId, lesson.id);
  }
  for (const mission of missions.values()) {
    if (mission.lessonId && !lessons.has(mission.lessonId)) problems.push(`Mission ${mission.id} expects lesson ${mission.lessonId}, which is not loaded; it is shown as an outline.`);
  }

  const errors = new Map();
  for (const err of (diagnostic && diagnostic.errors) || []) errors.set(err.id, err);
  for (const lesson of lessons.values()) {
    for (const r of lesson.rubric) if (!errors.has(r.errorTag)) problems.push(`${lesson.id} ${r.id} uses unknown error tag ${r.errorTag}.`);
  }

  const lessonOrder = missionOrder.map(id => lessonByMission.get(id)).filter(Boolean);
  return {
    lessons, lessonOrder, lessonByMission, modules, missions, missionOrder, errors,
    activationRules: (diagnostic && diagnostic.activationRules) || [],
    briefs: (notes && notes.plannedBriefs) || [],
    readings: (notes && notes.readings) || [],
    problems
  };
}

export function lessonFor(content, lessonId) {
  return content.lessons.get(lessonId) || null;
}

export function briefsForMission(content, missionId) {
  return content.briefs.filter(b => b.missionIds.includes(missionId));
}

export function readingsForMission(content, missionId) {
  return content.readings.filter(r => r.missionIds.includes(missionId));
}

export const MODE_INFO = {
  mobile: {
    label: "Phone or tablet",
    detail: "The core exercise and its evidence can be completed inside this app. No terminal needed."
  },
  hybrid: {
    label: "Hybrid",
    detail: "Preparation and review fit in this app; an observation, interview or tool exercise happens elsewhere."
  },
  external: {
    label: "External environment",
    detail: "The core task needs a separate automation or development environment. This app only records and reviews the evidence. Phone alternative: design the workflow or interpret supplied execution records here — that shows design or interpretation, not a completed live build."
  }
};
