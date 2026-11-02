# AI Business Practice Curriculum

## Purpose and outcome

This curriculum helps Martin become more capable at finding, designing, testing, and explaining useful AI improvements for small businesses. It assumes familiarity with AI tools and some ability to prompt and map tasks. It uses short practical attempts to locate the remaining gaps; uncertainty or low confidence is not treated as proof of low competence.

The main project is one business workflow. By the end, the learner should have a problem statement, process map, baseline, bounded prototype, test record, value assessment, and a draft pilot offer and handover. A fictional project demonstrates practice. A real project needs evidence from the people and systems involved. Neither completing lessons nor finishing a prototype guarantees a customer, revenue, or production readiness.

The structure preserves the substance of Dan Martell's supplied *AI Company Operating System Playbook*: the Buyback Loop, Camcorder Method, RCCF prompt format, and four deployment steps. Here the deployment sequence is abbreviated as **Audit → Build → Test → Scale**. The exercises, cases, rubrics, progression, and workload below are original teaching material. The app is not presented as an official Dan Martell product.

Revision 1.1 incorporates selected operating ideas from Jon Jones's writing, checked against primary technical documentation where relevant. The full rationale is in `../docs/jon-jones-review.md`. The three applied lessons deepen existing missions; module count, mission count and workload allocations remain the same.

Revision 1.2 refines discovery, prioritisation, value explanation and partner handover after reviewing Andrew Dunn's course transcript. Five planned authoring briefs are in `consulting-practice-backlog.md`, with the assessment in `../docs/andrew-dunn-review.md`. They remain outline material, not new completed lessons. The six authored lessons and all time allocations are unchanged.

| Authored lesson | Existing mission | Core exercise | Whole mission allocation |
| --- | --- | ---: | ---: |
| L01 — What can we actually confirm? | M00-01 | 25 min | 35 min |
| L02 — The owner asked for a chatbot | M01-01 | 25 min | 40 min |
| L03 — Will this prompt work on the next case? | M02-02 | 30 min | 45 min |
| L04 — Which steps need an agent? | M02-03 | 30 min | 45 min |
| L05 — The run says success. Where is the result? | M03-04 | 25 min | 35 min |
| L06 — Who keeps the workflow working? | M05-02 | 30 min | 40 min |

The remaining 22 missions are outlines. Optional reading from `reading-path.md` uses existing mission or project time when it resolves a specific question; it is not additional compulsory homework.

## Learning approach

- Begin with an attempt. Use the evidence of that attempt to decide whether to move on, retry, or practise a narrower skill.
- Explain only what helps with the next action. There is no required introductory tour of AI tools.
- Keep the task and the review separate. A convincing draft still needs checking against the inputs.
- Give a useful hint before an example answer. Example answers are available voluntarily and are never represented as the learner's work.
- Save the useful result: a question, prompt, map, test, decision, or operating note that can be reused.
- Apply a revised method to a different example before treating an improvement as transferable.
- Distinguish simulated work, work on owned systems, and client work. Do not infer live integrations or permission from a lesson.

The normal loop is **attempt → inspect → name one specific gap → practise that gap → retry on a variant → save the result**. Reading and completing screens do not establish competence.

## Navigation and evidence

Modules are available from the start. Recommended prerequisites are explanations, not rigid locks. An experienced learner can submit existing evidence, attempt a challenge directly, or skip a lesson. Skipping is recorded as skipped, not passed. An exercise completed after revealing its answer is recorded as guided practice.

For each attempt, retain the task, learner response, rubric observations, feedback source, next revision, and any applicable test evidence. Confidence can be recorded separately on an optional 1–5 scale before feedback. It must not determine the skill result.

Use narrow skill labels when an error is observed:

| Skill tag | An observable gap might be |
| --- | --- |
| `evidence_tracking` | A draft treats an assumption as a confirmed fact. |
| `problem_discovery` | An interview question leads the owner toward a preferred tool. |
| `workflow_mapping` | The map omits a decision, waiting step, or exception. |
| `context_design` | The prompt omits a rule needed for the task. |
| `output_evaluation` | The review checks tone but misses an unsupported commitment. |
| `automation_judgment` | A stable calculation is delegated to an unconstrained language model. |
| `testing_and_exceptions` | Tests contain only straightforward cases. |
| `value_measurement` | Freed hours are counted as cash savings without a realization mechanism. |
| `handover_and_scope` | Nobody is named to handle failed runs after delivery. |

Use observations such as “demonstrated on this case” and “needs another variant.” Do not award a broad mastery label from a single attempt or a self-rating.

## Suggested workload

The six-week arrangement is a planning option, not a deadline. The target is seven active hours a week within Martin's stated six-to-eight-hour range. Waiting for replies or software to run is not counted as active practice.

| Suggested week | Module | Guided missions | Additional project practice | Review and reflection | Total |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | M00 Diagnose and establish a working case | 180 min | 180 min | 60 min | 420 min |
| 2 | M01 Audit and discover the problem | 200 min | 160 min | 60 min | 420 min |
| 3 | M02 Design context and the workflow | 210 min | 150 min | 60 min | 420 min |
| 4 | M03 Build a bounded prototype | 180 min | 180 min | 60 min | 420 min |
| 5 | M04 Test and measure the result | 200 min | 160 min | 60 min | 420 min |
| 6 | M05 Explain, hand over, and repeat | 160 min | 200 min | 60 min | 420 min |
| **Total** | **28 missions** | **1,130 min / 18 h 50 min** | **1,030 min / 17 h 10 min** | **360 min / 6 h** | **2,520 min / 42 h** |

The additional project blocks are separate application and revision time: observe the chosen case, try the method on new inputs, build beyond the guided first attempt, or troubleshoot a failure. They do not repeat the minutes already assigned to a mission. The review hour covers examining evidence, choosing the next narrow improvement, and planning the following week.

For six hours a week, remove 60 minutes of additional project practice from each week's allocation: **36 hours total**. For eight hours, add 60 minutes of application or transfer testing each week: **48 hours total**. Reduce scope or extend the calendar if necessary; do not remove important verification just to finish on time.

Most guided missions can be split into 10–20-minute phone or tablet sessions. Protect one or two longer weekly blocks for work that is awkward on a small screen. A mission marked `external` requires work outside the learning app in the learner's chosen environment; it does not imply that the app can run that system. A manual simulation remains valid practice, but must be labelled as a simulation rather than a connected build.

### Mode values

- `mobile`: the core exercise and evidence can be completed inside the learning app.
- `hybrid`: preparation and review fit inside the app; observation, an interview, or a tool exercise happens elsewhere.
- `external`: the core task takes place in a separate workflow or development environment; the app records and reviews the evidence.

## M00 Diagnose and establish a working case

**Framework connection:** RCCF for an initial task; Buyback Loop for selecting where practice time will go.

**Purpose:** distinguish what Martin already does well from specific errors worth practising. No tool knowledge quiz is required.

### M00-01 Judge a flawed customer reply

- `moduleId`: M00
- `activeMinutes`: 35
- `mode`: mobile
- `starterLessonId`: L01
- **Practice:** complete L01 before seeing its example answer, then explain the most consequential error in one sentence.
- **Evidence:** a claim check, revised reply, and one observation about the review process.
- **Acceptance:** the review identifies unsupported commitments and preserves the customer's stated requirements. A miss leads to a short evidence-checking drill, not an entire beginner course.

### M00-02 Work a familiar task without assistance

- `moduleId`: M00
- `activeMinutes`: 45
- `mode`: mobile
- **Practice:** choose a familiar, anonymized task or a supplied fictional case. Produce the result unaided, then use an AI tool for a second attempt. Compare the actual work needed to reach a checked result.
- **Evidence:** both outputs, a small comparison, and observations about what helped or introduced rework.
- **Acceptance:** separate output quality from speed. Do not call the first slower attempt a reliable baseline for all future work.

### M00-03 Select one project and define its boundary

- `moduleId`: M00
- `activeMinutes`: 50
- `mode`: mobile
- **Practice:** select a local-service workflow that can be studied through accessible examples. Write the business goal, the user, the start and end of the task, and what is excluded.
- **Evidence:** a one-page project card marked fictional, owned-system, or potential client case.
- **Acceptance:** one observable task can be investigated without promising an entire company transformation. Assumptions and access needs are visible.

### M00-04 Create a personal practice plan

- `moduleId`: M00
- `activeMinutes`: 50
- `mode`: mobile
- **Practice:** use the initial attempts to select two narrow skills for deliberate practice. Place short sessions and longer application blocks into a realistic week. Decide what the freed time should support, using the Fill part of the Buyback Loop.
- **Evidence:** two evidence-linked practice targets, an available-time plan, and a next exercise for each target.
- **Acceptance:** targets describe actions, such as “mark unknown facts before drafting,” rather than identities such as “be better at AI.”

**Additional project practice, 180 minutes:** collect or create a small set of relevant examples; repeat the diagnostic on a changed case; organize the project evidence. Use owned, approved, anonymized, or fictional material.

## M01 Audit and discover the problem

**Framework connection:** Buyback Audit, Camcorder Method, and Deployment Step 1.

**Purpose:** discover a useful problem before committing to a tool or preferred solution.

### M01-01 Separate the complaint from the problem

- `moduleId`: M01
- `activeMinutes`: 40
- `mode`: mobile
- `starterLessonId`: L02
- **Practice:** complete L02 and identify what remains unknown after the fictional discovery conversation.
- **Evidence:** a provisional problem statement, neutral questions, and a small evidence request.
- **Acceptance:** the proposal is anchored in observed work and can be revised if the next examples contradict it.

### M01-02 Observe one complete task

- `moduleId`: M01
- `activeMinutes`: 40
- `mode`: hybrid
- **Practice:** use the Camcorder Method on an owned task, permissioned demonstration, or supplied simulation. Compare the owner's goal with the operator's account and a recent example using planned brief CP01. Record or narrate decisions and interruptions; a written walkthrough is acceptable when recording is unsuitable.
- **Evidence:** notes identifying inputs, decisions, outputs, an exception, any disagreement between accounts, and the next neutral question.
- **Acceptance:** distinguish observed work, reported practice and assumptions. Neither the manager nor operator is presumed wrong. The record contains no unnecessary private material; interview scope follows the question being resolved.

### M01-03 Map the path and the waiting

- `moduleId`: M01
- `activeMinutes`: 40
- `mode`: mobile
- **Practice:** turn the observed task into a small process map. Mark human work, waiting, system handoffs, decisions, and rework separately. Identify both time-consuming steps and quality risks, and retain unresolved differences between the accounts in CP01.
- **Evidence:** a map with a clear trigger and completion condition.
- **Acceptance:** a second reader can follow both the normal case and the observed exception without having to guess a handoff.

### M01-04 Establish a usable baseline

- `moduleId`: M01
- `activeMinutes`: 40
- `mode`: hybrid
- **Practice:** design and begin a small consecutive-case log. Separate active handling time from elapsed response time and track corrections or missing inputs.
- **Evidence:** a recording sheet plus sample observations labelled observed, estimated, or simulated.
- **Acceptance:** definitions are clear enough to use again after the change. A small sample is treated as preliminary evidence, not a population-wide guarantee.

### M01-05 Choose one opportunity

- `moduleId`: M01
- `activeMinutes`: 40
- `mode`: mobile
- **Practice:** compare three plausible improvements using frequency, value, feasibility, total effort, consequences of errors and available evidence. Use CP02's impact–effort shortlist with confidence, dependencies and adoption concerns visible. Include doing nothing or simplifying the process when relevant.
- **Evidence:** a provisional ranking stating the chosen problem, alternatives, uncertainty, pilot success criteria and who should validate the priorities.
- **Acceptance:** the priority follows the case evidence rather than a fixed department order or enthusiasm for a tool. A familiar automation category is not automatically a quick win.

**Additional project practice, 160 minutes:** perform a short discovery conversation or simulation; inspect further examples; complete the initial baseline; revise the problem statement. The practice should not assume permission for broad system access.

## M02 Design context and the workflow

**Framework connection:** Company Master Prompt, RCCF, Transfer, and Deployment Step 2.

**Purpose:** translate a business problem into clear inputs, rules, outputs, responsibilities, and a small proposed workflow.

### M02-01 Define a result that can be checked

- `moduleId`: M02
- `activeMinutes`: 35
- `mode`: mobile
- **Practice:** specify the desired output and the checks a competent user would apply. Identify the minimum information required to produce it.
- **Evidence:** an input-and-output contract with examples of acceptable and unacceptable results.
- **Acceptance:** criteria describe observable behavior. “High quality,” “smart,” and “like an expert” alone are insufficient.

### M02-02 Improve context and test a variant

- `moduleId`: M02
- `activeMinutes`: 45
- `mode`: mobile
- `starterLessonId`: L03
- **Practice:** complete L03 using RCCF. Keep business facts and rules distinct from style preferences and incoming customer text.
- **Evidence:** the revised prompt, test predictions, and a transfer-case review.
- **Acceptance:** the prompt handles missing information and an unfamiliar case without inventing permission, policy, or operational facts.

### M02-03 Choose AI, rules, or people for each step

- `moduleId`: M02
- `activeMinutes`: 45
- `mode`: mobile
- `appliedLessonId`: L04
- **Practice:** complete L04, then annotate the selected project's process map. Choose rules, a model step in a fixed workflow, a bounded agent, or human judgment for each part. Distinguish current input, approved context, remembered advice, and maintained business records.
- **Evidence:** a step-by-step allocation, the source of current business rules, and explicit tool, stop, retry and spending boundaries where an agent is proposed.
- **Acceptance:** each AI step has a defined input, output and verification method. A simpler adequate solution is valid. Instructions in a prompt are not represented as enforced permissions or model retraining.

### M02-04 Specify exceptions and review

- `moduleId`: M02
- `activeMinutes`: 40
- `mode`: mobile
- **Practice:** identify incomplete requests, conflicting instructions, unknown cases, and tool failures. Define what stops, what is retained, who reviews it, and what can continue. Place required approval before the governed action; keep routine notifications separate.
- **Evidence:** an exception table and a normal-case review rule.
- **Acceptance:** the design does not rely on the AI always knowing when it is wrong. Review decisions can be checked against explicit conditions.

### M02-05 Scope the smallest useful pilot

- `moduleId`: M02
- `activeMinutes`: 45
- `mode`: mobile
- **Practice:** write a pilot brief covering the problem, user, scope, examples, success criteria, access needed, and what the prototype will not yet establish. Use CP02 to check the provisional ranking with the relevant people or a supplied fictional follow-up. Revise it when hidden dependencies or adoption concerns change the choice.
- **Evidence:** a pilot brief, a short build sequence, and the reason for any change after validation.
- **Acceptance:** the prototype can demonstrate value with a narrow task before taking on broad external actions or live customer commitments. Client agreement and technical feasibility remain separate evidence questions.

**Additional project practice, 150 minutes:** test context on new examples in the learner's chosen AI tool; inspect how the existing business system represents the needed data; revise the pilot brief. Learn a missing technical concept only when this work exposes the need.

## M03 Build a bounded prototype

**Framework connection:** Transfer and Deployment Step 2.

**Purpose:** turn the design into an inspectable working path, with a clear distinction between manual simulation and connected execution.

### M03-01 Build the manual assisted version

- `moduleId`: M03
- `activeMinutes`: 35
- `mode`: hybrid
- **Practice:** run the chosen task manually with AI assistance and explicit review. Check whether the output is useful before connecting systems.
- **Evidence:** a worked example, corrected output, and a note identifying the step worth automating next.
- **Acceptance:** the user-facing result meets the pilot contract and its production still involves the stated review.

### M03-02 Trace one record between systems

- `moduleId`: M03
- `activeMinutes`: 35
- `mode`: hybrid
- **Practice:** map a single record's fields from input to output. If the project needs an API, webhook, or file import, learn that mechanism through this exact example. For each integration, identify what it reads or changes, the authoritative record, and the account and recovery owner; never record secret credentials in the learning app.
- **Evidence:** a small data and responsibility map with required fields, missing-value behavior, and a stable record reference.
- **Acceptance:** the learner can explain where each output value came from and what happens when a required input is absent.

### M03-03 Build the first narrow path

- `moduleId`: M03
- `activeMinutes`: 40
- `mode`: external
- **Practice:** implement the smallest path in an available automation or code environment. Use synthetic or permitted test inputs. This is a guided first build block; unfinished work continues in project practice time.
- **Evidence:** screenshots, a short recording, or inspectable configuration/code plus one traceable run.
- **Acceptance:** the actual implementation matches the stated simulation or connection level. A screenshot of a planned workflow is not labelled as a successful run.

### M03-04 Make failure visible

- `moduleId`: M03
- `activeMinutes`: 35
- `mode`: hybrid
- `appliedLessonId`: L05
- **Practice:** complete L05 using the fictional execution record. In project practice, apply the same reasoning to an actual safe failure test in an owned or authorised environment. Check detection, destination evidence, approval order and duplicate handling before retrying.
- **Evidence:** a reasoned diagnosis and recovery plan, plus any separately observed failure/recovery evidence. A phone-based interpretation stays labelled fictional; it does not establish a working integration.
- **Acceptance:** a worker's success message or clean exit does not substitute for the required result. A failure detector can notice a stopped worker, and unresolved cases have a bounded route to a responsible person.

### M03-05 Explain the build in ordinary language

- `moduleId`: M03
- `activeMinutes`: 35
- `mode`: mobile
- **Practice:** describe the workflow to a prospective user. Identify what it reads, proposes, changes, and leaves for review.
- **Evidence:** a one-minute explanation and an updated map.
- **Acceptance:** the explanation accurately reflects the implemented behavior, including limitations and external dependencies.

**Additional project practice, 180 minutes:** finish the bounded build, repeat runs on new inputs, troubleshoot a concrete failure, and record the working version. If small-screen constraints prevent a connected build, complete and label a manual simulation and schedule the external step separately.

## M04 Test and measure the result

**Framework connection:** Deployment Step 3.

**Purpose:** gather enough evidence to make a proportionate next decision, while remaining honest about untested risks.

### M04-01 Design representative tests

- `moduleId`: M04
- `activeMinutes`: 40
- `mode`: mobile
- **Practice:** create a compact test set from the pilot's actual decisions. Include ordinary, incomplete, conflicting, duplicate, and failure cases where relevant.
- **Evidence:** test inputs with expected outcomes defined before execution.
- **Acceptance:** tests exercise distinct failure risks rather than many cosmetic rewrites of the same easy input.

### M04-02 Run the tests and inspect the evidence

- `moduleId`: M04
- `activeMinutes`: 45
- `mode`: external
- **Practice:** run the bounded workflow and compare results with the expected outcomes. Record output, edits, handling time, and any failed action. Distinguish verified outcomes, legitimate skips, failures and unresolved runs; reconcile counts with the actual run inventory.
- **Evidence:** a test log linking each result to an input and workflow version.
- **Acceptance:** failures remain visible. A model's own claim of success does not count as verification that an external action happened.

### M04-03 Repair one cause and retest a new case

- `moduleId`: M04
- `activeMinutes`: 40
- `mode`: hybrid
- **Practice:** choose one consequential failure, identify its likely cause, and make a focused change. Retest the failure and a fresh variant.
- **Evidence:** before/after observations, the change, and a transfer result.
- **Acceptance:** the change addresses the cause without quietly weakening the acceptance criteria.

### M04-04 Estimate value without exaggerating it

- `moduleId`: M04
- `activeMinutes`: 40
- `mode`: mobile
- **Practice:** compare checked end-to-end effort, service quality, and costs per accepted outcome using CP03. Include setup, model and tool usage, retries, review, corrections, recovery, training and maintenance. Separate capacity released, cash costs avoided, and additional contribution from revenue. Keep fictional assumptions and dated vendor quotes separate from observed bills.
- **Evidence:** a small value assessment with a conservative and central scenario, labelled assumptions, and an explanation of how any benefit would be realized. If calculating simple ROI, state financial benefits and all defined costs for the same period, then divide net benefit by those costs.
- **Acceptance:** no double-counting of freed time and the work it enables. Estimates and observed results are labelled distinctly. Unused capacity is not automatically cash or sales; zero-denominator ROI is undefined. An unknown financial benefit remains unknown rather than becoming a persuasive invented number.

### M04-05 Decide whether to continue

- `moduleId`: M04
- `activeMinutes`: 35
- `mode`: mobile
- **Practice:** choose continue, narrow, revise, pause, or stop. Explain what the evidence supports and the next uncertainty worth resolving.
- **Evidence:** a pilot decision note with one concrete next step.
- **Acceptance:** continuation is earned by the result, not by the time already spent building.

**Additional project practice, 160 minutes:** gather additional relevant cases, resolve a consequential uncertainty, conduct a user walkthrough, or check value assumptions. Spend the time where the evidence is weakest; avoid expanding tests only to increase their count.

## M05 Explain, hand over, and repeat

**Framework connection:** Deployment Step 4, SOP creation, and the next Buyback Loop.

**Purpose:** convert a useful result into a clear offer and maintainable practice. This module does not imply that the learner has sold or deployed the work.

### M05-01 Present the result honestly

- `moduleId`: M05
- `activeMinutes`: 40
- `mode`: mobile
- **Practice:** use CP04 to create one concise client explanation as a one-page brief or short demonstration. Cover the problem and scope, evidence, options, recommended pilot, benefits and costs, and the next decision. Include a checked example when available.
- **Evidence:** a decision brief or demo script with an evidence-backed result summary; slides are optional.
- **Acceptance:** fictional numbers remain fictional, pilot observations remain pilot observations, and projections remain estimates. The client can identify the recommendation, its reason, their contribution and the next decision.

### M05-02 Draft a bounded pilot offer

- `moduleId`: M05
- `activeMinutes`: 40
- `mode`: mobile
- `appliedLessonId`: L06
- **Practice:** complete L06, then draft the selected project's offer. Compare a client-operated tool, commissioned build and managed service where relevant. State the tested outcome, scope, client input, delivery evidence, operating and maintenance owners, ongoing costs, and exit arrangements. Use CP05 when a stand-alone assessment or delivery partner fits the case; neither is compulsory.
- **Evidence:** a draft offer with a supported value discussion and clear responsibilities that can be reviewed before it is sent.
- **Acceptance:** the arrangement has a credible operator and support plan. The offer avoids guaranteed results, undefined unlimited support, and promises that exceed demonstrated capability. A build fee, support agreement or managed service can each be valid when justified. Sending is a separate real-world action.

### M05-03 Prepare the handover and operating routine

- `moduleId`: M05
- `activeMinutes`: 40
- `mode`: hybrid
- **Practice:** use the Camcorder Method to explain the working process. Document ordinary use, review, failures, ownership, changes, and how to stop the workflow. Where delivery uses a partner, apply CP05 to identify the feasibility reviewer, acceptance evidence, client contact and ongoing support owner.
- **Evidence:** a concise SOP, owner table, first-review checklist, and handover inventory covering accounts, delivered configuration/code, exportable records, ongoing costs and removal of unnecessary access.
- **Acceptance:** another person can use the material to run the normal case and respond to the tested failure without relying on the builder's memory.

### M05-04 Transfer the method to a second business

- `moduleId`: M05
- `activeMinutes`: 40
- `mode`: mobile
- **Practice:** apply the discovery and scoping method to a different local-service example. Decide what can be reused and what requires new evidence. Choose how to use any time freed by the first improvement.
- **Evidence:** a second problem hypothesis, reuse notes, and a next-cycle plan.
- **Acceptance:** the learner identifies reusable components and reconfirms the second business's rules, data, permissions, review responsibilities and priorities with fresh examples. A copied configuration is not evidence of client fit.

**Additional project practice, 200 minutes:** refine a demonstration and handover with another person's feedback; practise a discovery or pilot conversation; improve the reusable project materials. A real outreach conversation is optional and should be deliberate, not an automatic app action.

## Feedback and next-step rules

1. **A supported result with a clear explanation:** suggest a harder variant or the next mission. Preserve the option to continue practising.
2. **One specific omission or assumption:** identify the exact passage, provide a hint, and offer a short targeted retry.
3. **Several different gaps:** let the learner choose the most consequential one first. Do not assign an entire remedial module automatically.
4. **Missing evidence:** request the smallest missing artifact. Do not substitute an invented score or assume that a connected workflow ran.
5. **Disagreement with feedback:** allow the learner to challenge it with evidence. An external AI review is advisory and can be wrong.
6. **A successful retry:** test a different example before claiming the improvement transfers.

Feedback provenance must be visible: **self-review**, **static example comparison**, **optional external AI review**, or **observed tool/test evidence**. A prewritten response must never be presented as a live model's assessment.

## Completion record

Completion produces a project portfolio with explicit evidence status, not a certificate of business success. It should show what was attempted, demonstrated, simulated, reviewed, skipped, or left uncertain. A useful finish is one defensible business improvement and a clearer picture of the next skill to practise.
