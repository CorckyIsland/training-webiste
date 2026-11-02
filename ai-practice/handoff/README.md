# AI Business Practice

## Purpose

A personal learning app for Martin to turn existing AI tool familiarity into reliable business work. The first outcome is one useful workflow he can explain, test, and demonstrate. Dan Martell's playbook supplies the operating framework; customer discovery, targeted practice, and mobile learning design make it usable at Martin's current stage.

This package is a build-ready design and content handoff, revision 1.2, dated 2026-11-02. It contains a mapped curriculum and six fully authored lessons: three starter lessons and three applied lessons added after reviewing Jon Jones's work. Revision 1.2 adds five planned consulting-practice briefs based on Andrew Dunn's course, with qualifications and source checks. Those briefs are not additional completed lessons. The package does not contain a deployed application or 28 completed lessons.

## Confirmed requirements

- Martin knows how to use many AI tools and does not want an introductory tour of their interfaces.
- He wants to improve prompting, task mapping, and confidence through observable practice.
- His available learning and practice time is 6–8 hours per week.
- He will mainly use a phone or tablet.
- He wants to apply Dan's framework before substantially altering it.

## Design decisions

Begin with a short practical diagnostic. Show which specific decisions were sound and which need another attempt. A learner who misses a fact should receive a drill about checking facts, rather than being labelled a beginner.

Keep three app destinations: Today, Course, and My Work. Lessons use short sections, a clear task, progressive hints, a rubric, an example answer, and a transfer case. All learning content remains browsable.

Default to a personal web app, English content, local browser saving with explicit export/import, and use of existing AI chat tools for optional review. These are proposed defaults, not user-confirmed preferences. They can be changed without redesigning the learning method. Device-local saving does not automatically synchronise a phone and tablet.

## Package map

| File | Use |
| --- | --- |
| `CLAUDE_BUILD_PROMPT.md` | The request to give Claude Code when starting implementation. |
| `docs/product-spec.md` | App behaviour, evidence states, mobile layout, assistance, persistence, and scope. |
| `docs/acceptance-criteria.md` | Observable release checks for the first build. |
| `docs/design-decisions.md` | Why these choices fit Martin; unresolved options and limits. |
| `docs/framework-and-sources.md` | Attribution, research sources, and separation of original method from app design. |
| `docs/delivery-status.md` | What is prepared, what was checked, and what Claude still needs to implement. |
| `docs/jon-jones-review.md` | Research assessment and the reasons for the revision 1.1 additions. |
| `docs/andrew-dunn-review.md` | Transcript assessment, material claim checks and reasons for the revision 1.2 refinements. |
| `content/curriculum.md` | The complete mission map and suggested workload. |
| `content/starter-lessons.md` | Human-readable versions of the three starter lessons. |
| `content/starter-lessons.json` | App-readable starter content; keep IDs and versions stable. |
| `content/applied-lessons.md` | Human-readable L04–L06: design choice, verified outcomes, and commercial ownership. |
| `content/applied-lessons.json` | App-readable applied content, using the same lesson contract. |
| `content/reading-path.md` | Optional sources paired with a question and an existing mission. |
| `content/consulting-practice-backlog.md` | Five planned authoring briefs for discovery, prioritisation, value, presentation and delivery partners. |
| `content/diagnostic-map.json` | Named observations and targeted follow-up exercises. |
| `schemas/lesson.schema.json` | Shared contract for both lesson content files. |
| `schemas/progress.schema.json` | Initial export/import contract. |
| `samples/progress-example.json` | Synthetic example of a saved attempt and its provenance. |

## How to use this with Claude Code

1. Put the unpacked folder inside the project workspace available to Claude Code.
2. Give Claude Code the contents of `CLAUDE_BUILD_PROMPT.md` and access to this folder.
3. Have it implement the first complete lesson loop, including save/resume and export, then the other two starter lessons. Add L04–L06 through that same interface after the first loop works.
4. Try that loop on the phone or tablet you will actually use. Record friction and revise the interface or exercise where needed.

The build tool needs a suitable execution environment. This package does not assume that every integration, terminal, or automation builder will work directly on a phone. The learning app itself must support reading, attempts, review, and exporting on mobile.

## What to try first

L01 asks Martin to inspect a fictional taxi response and identify claims the available information cannot support. L02 develops discovery questions around a local service business. L03 improves an RCCF prompt and tests it on a changed case. The app records work and review evidence; it does not award expertise because a lesson was opened or an AI approved an answer.

L04 then asks which steps need rules, a fixed AI step, an agent, or human judgment. L05 examines a fictional run that reports success without producing the required result. L06 turns a small workflow into a pilot offer with clear operation, maintenance, costs, ownership, and exit. These occupy existing missions; they do not add weeks or change Dan's framework.

The consulting-practice backlog sharpens the remaining outlines. It develops two-perspective discovery, client validation, transparent benefits and costs, a concise decision brief, and an assessment/partner option. Keep it available for later content authoring while building the same first lesson loop. The curriculum still has 28 missions and unchanged time allocations.

## Suggested weekly rhythm

Use a flexible seven-hour example: 90 minutes of short lessons and drills, 150 minutes of practical workflow work, 90 minutes of discovery or observation, 60 minutes of review and documentation, and 30 minutes of buffer. Split these into sessions that fit the week. The curriculum describes how to use a six- or eight-hour week.

The six-module plan is a suggested sequence, not a deadline or promise of a first client. A later module may take more than one week. A real workflow and a useful customer conversation are more informative than finishing a prescribed number of pages.

## Boundary of this delivery

The package supplies product decisions, complete initial teaching content, data contracts, and release criteria. Hosting, accounts, cross-device cloud sync, paid AI integration, and live customer-system connections remain outside the initial implementation. Keep those boundaries visible in the app and revisit them when actual use justifies the work.
