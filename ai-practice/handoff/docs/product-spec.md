# AI business practice product specification

## Purpose and first milestone

Create a private learning app that helps Martin turn familiar AI tools into dependable business work. He knows most tools; the starting task is to calibrate confidence against observable work, identify specific gaps, and practise those gaps. Avoid a beginner tour of chat interfaces.

The first milestone is one complete lesson loop producing an inspectable result. The wider path leads toward a measured workflow and evidence for a small client pilot. Lesson completion does not establish competence or guarantee a customer.

Preserve the playbook's progression through auditing, designing workflows, testing, and standardising. Use fictional cases initially. Introduce live business access only in an explicitly labelled optional activity with the necessary permission and suitable tools.

## App structure

Use three persistent navigation destinations:

| Destination | Purpose | Primary action |
| --- | --- | --- |
| Today | Resume an attempt or show the next useful mission and its purpose. | Continue the next concrete action. |
| Course | Browse modules, missions, examples, and available practice branches. | Choose, repeat, or skip a mission. |
| My Work | Inspect attempts, notes, feedback, measurements, and project evidence. | Review work or export it. |

Place definitions beside relevant activities. Keep backup and restore accessible from My Work and settings.

Support the curriculum's stable module IDs M00–M05 and 28 mission IDs such as M00-01. Detailed lessons map L01 to M00-01, L02 to M01-01, L03 to M02-02, L04 to M02-03, L05 to M03-04, and L06 to M05-02. Lesson labels and order may change without changing IDs. The other 22 missions must appear as outlines rather than complete interactive lessons. Load both content bundles using the same lesson contract and renderer.

## Lesson loop and diagnosis

Each lesson contains a concrete outcome, short rationale, worked example, attempt, rubric, feedback, targeted practice, and transfer task. Its primary loop is:

1. Record confidence and a predicted difficulty before attempting the task.
2. Attempt the task using supplied fictional inputs or approved materials.
3. Compare the result with observable criteria and record supporting evidence.
4. Review feedback, identify a specific error, and select one relevant drill.
5. Revise the work or try a new case, then explain what changed.

Keep diagnosis content-driven. Each error mapping needs a stable error ID, a concrete observation, an explanation, and a linked drill. Useful categories include an unsupported assumption, an unclear success criterion, a missed exception, or a comparison that omits checking time. These are task errors, not personality labels.

Local rules may evaluate questions with an authored answer key and explicit checkbox or choice responses. They must not claim to understand, grade, or diagnose free-text work. A missing required field is incomplete evidence; it does not prove lack of skill. Unassessed prose displays “Not assessed”.

For open-ended work, offer a manual rubric and an optional external review prompt. The learner can accept, reject, or amend each feedback item and attach evidence. Compare initial confidence with supported outcomes descriptively; do not generate a numerical competence score from completion, confidence, or an AI verdict.

Provide progressive hints and an explicitly revealed model answer; record assistance used. Reading an answer never advances an attempt or awards competence. Transfer cases must change a relevant condition.

Revision 1.1 adds design choice (L04), outcome verification and recovery (L05), and commercial ownership (L06). These are authored case studies, not live agent runners. Display fictional records and tool responses as supplied evidence; never label them as an actual run by Martin. Optional reading prompts support the current task and do not create another navigation destination or completion gate.

Revision 1.2 records five planned consulting-practice briefs in `../content/consulting-practice-backlog.md`. They refine existing mission outlines and leave the six authored lessons unchanged. Present them only as planned notes until complete lesson content exists. A simple list can represent an opportunity matrix; a one-page note can represent a client presentation. Dedicated editors, numerical opportunity scores and live outreach are not required. Arithmetic may eventually calculate supplied values, but it must not certify assumptions, assess prose or turn estimated capacity into cash savings.

## Evidence states

Use these finite states for the active attempt. Keep timestamps and the evidence supporting transitions.

| State | Required evidence |
| --- | --- |
| seen | The learner opened the lesson. |
| attempted | The learner explicitly submitted an attempt snapshot. |
| self_checked | The learner recorded a rubric check and notes against that snapshot. |
| reviewed | The learner inspected feedback and recorded a response or revision decision. |
| applied | The learner submitted a separate transfer task and its check. |

States describe activity and evidence, not grades. Show whether an applied result is fictional, simulated, or live. A simulated run cannot be labelled a completed live integration. Viewing content, revealing hints, pasting feedback, and ticking a completion button cannot independently satisfy these transitions.

Maintain separate drafts and submitted attempt revisions. Feedback and checks refer to a specific revision. Submitting changed work creates a new active revision at attempted; previous checks remain available but visibly belong to the earlier revision. Preserve earlier transfer evidence as history. Browsing and skipping remain possible regardless of state.

## Mobile and tablet experience

Use a single content column, short sections, progressive disclosure, and one prominent next action. Avoid side-by-side editors, drag-only controls, and wide tables. Target touch controls of at least 44 CSS pixels. Keep typing fields visible above the software keyboard, provide clear focus, and preserve unfinished text when navigating away.

Reading, writing attempts, using rubrics, exporting work, and copying prompts must require no terminal. Full integration exercises may need a compatible external builder or computing environment. State that requirement before the learner starts and provide a phone-accessible alternative such as designing the workflow or evaluating supplied execution records. Label precisely which objective the alternative demonstrates.

Suggest a flexible 6–8 hours weekly: about one hour studying examples, three hours attempting and revising work, one hour checking results, and one to three hours on transfer practice or business discovery. Let these become short sessions. Do not create calendar events, reminders, streak penalties, or scheduled automations.

## External AI assistance

No paid API, embedded model, or new subscription is required. Generate a review packet containing the task, fictional facts, submitted work, rubric, and instructions to separate observed errors from uncertainty. Show the exact packet before the learner copies it to their chosen AI tool.

Support normal clipboard copying plus a selectable text fallback. If the learner pastes a response back, retain its provenance as external_ai_unverified. Human review is a separate event and must not rewrite that provenance or imply independent correctness. Use a manual feedback form if the response cannot be parsed. Never silently send work to an external service.

## Persistence, backup, and restoration

Default to browser storage on one device and browser profile. Autosave drafts and progress, show saving/saved/error states, and preserve the last confirmed snapshot. Device changes, different browsers, cleared site data, or browser storage loss can remove access to that copy. Do not describe local storage as cloud backup or synchronisation.

Make “Saved on this browser” and the last export time visible. On first use, explain backup briefly and offer an export after the first substantive completed attempt. Avoid repeated interruptions. Exports occur only after an explicit user action.

Provide a complete JSON backup for restoration and a readable Markdown export of selected project work. Include notes, drafts, attempt revisions, state evidence, feedback provenance, and measurements. Show the export scope before downloading; do not silently include unrelated work.

Before import, validate the file and show what will be added and which records conflict. Require confirmation before applying changes. Identical records may be deduplicated; conflicting records require an explicit keep-local or use-imported choice. Offer a backup of existing work before replacement. Invalid or unsupported files leave current work untouched. Never silently overwrite, discard, or execute imported content.

Multi-device cloud saving is a later optional enhancement. Export/import can move work between devices, but the app must not call this automatic sync.

## Content and application boundaries

Keep curriculum content separate from interface and persistence code. Store stable module, mission, lesson, rubric, and error IDs alongside content versions. Progress includes its own schema version and the content version used for each attempt.

A wording-only content update preserves existing progress. A changed rubric or exercise retains historical work under its original version and offers a fresh attempt. Unknown imported lesson IDs remain preserved as archived work rather than being dropped. Schema migration must validate a candidate result before committing it and retain a recoverable previous copy.

Use a static web interface and browser storage; verify the runtime and dependencies before choosing libraries. Defer backends, analytics, public profiles, and sharing. Render learner and imported text as inert content.

## Network and offline scope

Initial loading and reloading may require a network connection. Once the app and a lesson are loaded, editing that lesson and saving locally must not require an AI or network request. External AI review and external builders require their own connectivity. Do not promise offline cold starts, installed-app behaviour, background execution, or offline access to unopened content unless separately implemented and verified.

## Implementation milestones

1. Deliver one working lesson end to end: mobile reading, attempt, rubric, feedback response, targeted drill, resume, and export. Use L01/M00-01 as the initial slice.
2. Verify persistence, safe import, revision-linked evidence, version changes, and mobile keyboard behaviour before adding breadth.
3. Add L02 and L03, the module map, and My Work aggregation. Then add L04–L06 with the same renderer and saving behaviour. Mark remaining outlines honestly.
4. Run the starter path with Martin, identify observed friction, and refine it before expanding content or adding services.

Verify material risks using the acceptance criteria. Live deployment, account setup, and external integration are outside this handoff.
