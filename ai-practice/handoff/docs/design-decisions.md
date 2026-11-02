# Design decisions

## Confirmed and proposed

Martin's confirmed preferences are deeper practice rather than a tool introduction, 6–8 available hours weekly, and mainly phone/tablet use. His confidence is uncertain; that is not evidence of low ability. Begin with a task that lets him show what he already knows.

Proposed defaults are a personal English-language app, short resumable activities, three navigation destinations, fictional starter cases, local device saving, and optional AI help through his existing tools. The working name is AI Business Practice. Branding and visual preferences are reversible and should not delay a useful first lesson.

## What the app teaches

The app develops the ability to notice a recurring business problem, ask for evidence, describe the work, decide where AI helps, create a small solution, verify its result, and explain a limited paid offer. It also teaches when the available information is insufficient and how to ask the next useful question.

The user-facing workflow is simple. Underneath it, every exercise has a purpose, observable criteria, common mistakes, and a small follow-up drill. For example, a learner who approves an invented booking price gets a practice task about separating supplied facts from assumptions. A learner who notices the price but misses an unconfirmed collection time gets a different follow-up.

Show strengths through observations too: “You kept the passenger count unchanged and asked for the missing pickup location.” Avoid broad labels such as beginner, expert, or 87% competent.

## Assessment and evidence contract

The lesson review prompts and the progress record use two different vocabularies deliberately:

| Learner's manual rubric result | Comparable advisory reviewer result |
| --- | --- |
| `met` | `demonstrated` |
| `needs_work` | `needs_revision` |
| `uncertain` | `not_assessable` |

This table explains meaning; it does not authorise automatic conversion. Store external criterion results under the feedback record's optional `criterionReviews`. They remain advisory, with `external_ai_unverified` provenance when produced by AI. Martin records his own rubric check separately. His response can accept, reject, or amend feedback without changing its origin. A keyed-choice check assesses only that choice, not accompanying prose.

Keep `seen`, `attempted`, `self_checked`, `reviewed`, and `applied` as the only evidence states. Skipping and starting guided practice are events or display labels. Viewing a hint, revealing an answer, or importing feedback never changes the evidence state by itself.

Each submitted revision is immutable and has its own evidence. A new submission starts at `attempted`; an earlier review cannot certify it. JSON schema validates record shapes, but the application must also check references and derive the supported state from events for that revision after import. In particular, `reviewed` requires an explicit feedback response, and `applied` requires a separate transfer submission with a recorded check. Do not trust an imported state label alone.

In the starter JSON, `nextDrill` supplies the changed-case transfer prompt; targeted remedial drills come from `diagnostic-map.json`. Store a transfer result separately from the original submission and preserve its fictional, simulated, or live label. Completing a remedial retry or merely opening `nextDrill` does not establish `applied`.

## Preserve the source method

Dan's four deployment steps remain the course spine. The six modules simply group preparation, those steps, and their use in a first client project. The Buyback Loop is revisited after a successful improvement: the learner records what they will do with freed capacity. The original Replacement Ladder is taught as written and can be tried as a default; local exercise selection is a separate pedagogical decision.

Customer discovery and a bounded offer are included because Martin is preparing to start a business. These topics are also present in Dan's supplementary business teaching. Added exercises and review structures are labelled as app design, not attributed to the uploaded playbook.

## Mobile use

Design for quick returns from an AI chat app: drafts must survive navigation and reload after a confirmed save. Avoid multi-pane editors and drag-to-map tasks. Use short ordered rows to capture a process; offer an expanded view on tablets without changing the learning sequence.

Use normal text inputs so the device's keyboard and available dictation can be used. Keep a concise answer sufficient when it demonstrates the decision. Long essays should be optional. A learner can make a draft on a phone and finish a practical build in a compatible browser or other environment.

Give each activity a device/environment label. Some integration tasks require external tools. A phone alternative may test the workflow design or interpretation of execution records, but should not claim that an integration was built or run.

## Workload

Six modules may be followed over six weeks at approximately seven hours per module, or spread out further. The estimate includes observation, building, checking, and retries. It does not imply that reading 28 short mission descriptions consumes 42 hours or that six weeks guarantees a client.

A light week should preserve one attempt, one check, and one small next action. Extra time can go toward a new case or a real conversation. Avoid automatic deadlines or scheduled reminders in the first release.

## AI assistance and cost

Start with authored hints, example answers, and manual rubrics. Offer an explicit copyable packet for an external AI reviewer. This uses the tools Martin already chooses without introducing an embedded model requirement. Automatic tutoring can be added after we know which feedback is helpful enough to justify its cost and maintenance.

A future tutor should explain evidence, ask the learner to think, and admit uncertainty. It should not auto-complete the exercise or silently award competence. The initial deterministic prototype checks authored selections only.

## Saving and multiple devices

For the initial build, work is saved in the current browser profile with export/import. This is the smallest default that keeps attempts recoverable without introducing a backend. It does mean phone and tablet copies do not automatically stay in sync.

Browser data may be removed by the user or subject to browser storage policies. The app must identify the local save, make backups easy, and handle storage errors honestly. [MDN storage policies](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), checked 2026-11-02.

If automatic phone/tablet continuity proves important, add authenticated cloud saving as a separate product requirement before relying on it. Keep the content and progress contracts compatible with that later change.

The first build promises offline editing only after the relevant page is loaded. Offline reopening requires a deliberate caching strategy; installing an app-like shortcut is not proof of offline support. [MDN offline operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation), checked 2026-11-02.

## Decisions to revisit after trying the starter path

### Revision 1.1: selected Jon Jones material

L04–L06 turn the research into original practice in three existing missions: choosing an appropriate mechanism, verifying and recovering a result, and agreeing commercial ownership. The app keeps the same navigation, lesson contract, evidence states, saving approach and optional external review. Learning about an agent does not require the learning app to become an agent runner.

Source context matters. Public code supports an assessment that implementation work exists; author-reported operational figures and income implications remain unverified claims. Use the newer operating accounts alongside broad introductory pieces. Exact tool commands, current prices and licences are checked when selecting a concrete build. Reading remains optional and uses existing time allocations.

No infrastructure prerequisite is added. Martin may complete the supplied cases on a phone, then practise a real integration in a compatible external environment when the chosen project calls for it. A fictional execution trace never counts as his completed live run.

### Revision 1.2: selected consulting practice from Andrew Dunn

The user supplied a long course transcript and asked to add useful material to the app plan. The useful increment is a client-facing discovery and decision process: compare accounts, validate a priority, explain benefits and costs, present a clear next decision, and assign partner responsibilities.

Record five planned briefs inside existing missions. Keep the six authored lessons and their content versions unchanged. The briefs are not extra compulsory lessons or a request to build dedicated matrix, spreadsheet, presentation, sales or partner-management tools. Simple phone-friendly fields and notes can support future authored activities.

Keep the assessment valuable even when it recommends no implementation. Do not teach mandatory audit prices, a fixed interview count, guaranteed success through maintenance, or earnings claims as local benchmarks. The source's technical demonstrations reinforce existing verification practice rather than requiring a multi-agent architecture.

### Observe actual use

Observe whether copying review packets is inconvenient, whether switching devices is common, whether English or Nynorsk better supports thinking, and whether tasks are too easy or too long. Those observations determine whether to add a tutor, cloud sync, translated content, or shorter exercises. They do not block the first useful build.

## Success measures

For the app, check whether Martin resumes successfully, finishes an attempt, identifies a concrete improvement, and transfers it to a changed case. For the eventual client workflow, measure the actual result, checking/correction effort, operating cost, and customer usefulness. Keep those two levels distinct.
