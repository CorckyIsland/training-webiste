# Three Applied Lessons

Revision 1.1, 2026-11-02. L04–L06 deepen existing missions using original fictional cases informed by the source review. Each lesson uses manual rubric checks; supplied traces are not live runs. Hints and answers record assistance without advancing evidence state. The core activity times fit inside the existing mission allocations.

## L04 Which steps need an agent?

- Lesson ID: `L04`
- Mission ID: `M02-03`
- Module ID: `M02`
- Content version: 1
- Core activity: 30 minutes; allow 45 minutes for the full mission including the transfer task and evidence notes.
- Mode: phone or tablet; no terminal, paid API, or live integration required.

### Goal

Choose rules, a fixed AI step, or a bounded agent for an enquiry task; separate current evidence from remembered notes and define a small, checkable scope.

### Before you begin

Record a short confidence note before attempting the case. You may pause, skip, or reveal hints. Seeing the example answer creates a guided-practice label or event; it never creates a new evidence state or awards competence. This lesson uses a manual rubric. The app must not infer the quality of free text through keyword matching.

### Case and available information

Original fictional practice case; no connected services or live runs.

- Fjord Tool Hire is a fictional local equipment-rental business. The pilot prepares internal enquiry records and reply drafts for staff. It cannot send messages, reserve equipment, promise delivery, or quote prices.
- Current service policy v3, approved 1 June 2030: Bergvik and Fjordvik are normal delivery areas. Other towns require staff assessment. Required intake is name, contact detail, requested item, exact date, and town. Missing or ambiguous information stays unresolved.
- The dated product catalogue and current stock table are the maintained sources for item details and a stock snapshot. A stock snapshot is information, not a reservation. One enquiry record is stored per source message ID.
- An old undated memory note says: Elveby is always a normal delivery area. That note conflicts with the current approved policy and must not override it.
- Available read tools for a later test are find_item(search_text), which returns catalogue matches and compatibility notes, and read_stock(item_id, date), which returns a dated stock snapshot. Neither tool can reserve, send, or approve anything.
- The manual prototype has no actual tool connections. Describe or simulate calls, and label them as such. This exercise incurs no paid API usage.
- Rules means the steps and conditions are defined in advance. A fixed AI step interprets language inside a defined sequence. A bounded agent chooses its next permitted action from what it discovers. None is a compulsory upgrade from another.
- Input is the current enquiry. Context supplies relevant policies and task instructions. Memory carries selected notes between runs; it does not retrain the model or replace the business record.

#### Case material

Variant A — A structured form supplies a valid catalogue item ID, exact date, name, contact, and Bergvik as the town. The task is to copy the fields into the internal enquiry record and mark it ready for staff review.

Variant B — Message B-104: “I am Nora in Elveby. I need a pressure washer for 12 June 2030. Please reply at nora@example.invalid. Can you confirm delivery?” The task is to extract the details, check completeness and service-area rules, and draft a reply for staff.

Variant C — A possible later service asks for an internal comparison of suitable alternatives when a requested item is unavailable. Some requests name an exact item; others describe a task, and the next catalogue or stock check depends on what has already been found. Staff still decide suitability and any customer commitment.

All names, dates, addresses, and records here are fictional. The .invalid address must not be contacted.

#### Proposed design to assess

Proposed build: use one always-running agent for all three variants. Give it every company tool, let its memory decide delivery rules, and keep retrying until it can report success.

### Your task

Choose the simplest justified mechanism for A, B, and C. Design Variant B in at most six steps. Explain the roles of the input, current policy, memory note, and enquiry record. Then define permissions and limits for a possible C pilot, without building or running it. A justified fixed workflow or human route for C is valid; an agent is not required.

1. **A, B, and C: rules, fixed AI step, bounded agent, or human review — and why**
2. **Variant B: up to six steps, including the final evidence of completion**
3. **Which information is input, approved context, remembered advice, and the business record?**
4. **Possible C pilot: allowed tools, prohibited actions, stop conditions, retry rule, and spending limit**

Use short notes or numbered rows. A justified alternative that meets the criteria is valid. This is a design and evidence exercise; writing a plan does not establish that an integration has run.

### Self-check rubric

For your own check, record `met`, `needs_work`, or `uncertain` and point to evidence in your attempt. A missing answer is incomplete evidence, not proof that you lack the skill. Keep consequential unresolved errors visible instead of averaging them into a score.

| Criterion | Evidence to look for | Targeted error |
| --- | --- | --- |
| L04-R1 Mechanism fits the work | Uses rules for A and a fixed sequence with a language step for B, or justifies an equally adequate simpler approach. Treats C as a conditional choice based on the need for runtime decisions, not a mandatory agent upgrade. | `SOLUTION_FIRST` |
| L04-R2 Current evidence outranks an old note | Identifies the enquiry as input, policy v3 as approved context, the old note as potentially stale memory, and the enquiry/stock records as maintained business data. Keeps Elveby subject to staff assessment. | `UNSUPPORTED_FACT` — consequential if unresolved |
| L04-R3 Authority remains bounded | Limits any C pilot to the needed catalogue and stock reads and an internal comparison. Does not grant sending, booking, pricing, or delivery-confirmation authority. | `UNSUPPORTED_COMMITMENT` — consequential if unresolved |
| L04-R4 Completion can be inspected | B ends with a saved enquiry record and reviewable draft whose fields and review flag can be checked. A stock result is not treated as a reservation or evidence of promised delivery. | `UNVERIFIED_COMPLETION` — consequential if unresolved |
| L04-R5 Limits and failure routes are concrete | Names an action or time limit, a bounded retry rule, an explicit spending boundary for any real pilot, and a stop/escalation route. Does not expand permissions or retry indefinitely to finish. | `UNBOUNDED_EXECUTION` — consequential if unresolved |
| L04-R6 The decision can change with evidence | Explains what simpler known branches or a failed test would change the C choice, and distinguishes the proposed or simulated design from a working integration. | `UNCHECKED_OUTPUT` |

### Hint 1

Ask who needs to decide what happens next. Copying validated form fields does not require language interpretation. Reading a free-text enquiry does not mean the model must control the whole workflow.

### Hint 2

For B, compare Elveby with the current approved policy. A remembered shortcut cannot grant a new delivery promise. What should the internal record say?

### Hint 3

For C, identify the uncertainty the agent would resolve, then limit its search. Name what happens when a tool fails, alternatives remain ambiguous, or the run reaches its limit.

### Example answer

Reveal after your attempt or when you deliberately choose guided practice. This is one authored example, not observed AI output or the only valid answer.

#### Mechanism choices
A: use rules to validate and copy the supplied form fields. Add no model for this task.
B: use a fixed workflow with one language step to extract the enquiry and prepare a draft. The defined rules, not the model, decide whether the town needs staff assessment.
C: a bounded agent may help if each discovery changes the next useful lookup. First try writing the branches. If a short list of catalogue and stock checks covers the job, keep a fixed workflow. Sending ambiguous cases to staff is also a valid pilot choice.

#### Variant B in six steps
1. Receive message B-104 and retain its source ID; check whether an enquiry record already exists for it.
2. Give the language step the message, current policy v3, required fields, and draft-only task.
3. Extract Nora, the supplied contact, pressure washer, 12 June 2030, and Elveby. Do not turn the customer's delivery question into an approved arrangement.
4. Validate the fields. The town rule marks this enquiry needs_staff_assessment. Retire or flag the conflicting old memory note.
5. Prepare a short draft: “Thank you, Nora. We have noted your request for a pressure washer on 12 June. Our team will assess delivery to Elveby and confirm what we can offer.” Save it internally with the extracted fields and review flag.
6. Read the saved record back by source ID and check those fields. Report the record identifier and that it awaits staff assessment. No message has been sent and no equipment reserved.

#### Information roles
The enquiry is the current input. Policy v3 and the task rules provide approved context. The old note is memory to correct, not current delivery authority. The enquiry record stores task state; the catalogue and stock table hold their own maintained facts. Reading a correction next time can improve behaviour through context; it does not change the model's trained weights.

#### Example bounds for a later C pilot
Allow only the two read tools and preparation of an internal comparison. For this fictional design, limit a run to six read calls or 90 seconds, whichever comes first; allow at most one retry for a temporary read failure within those limits. Missing facts, an authentication failure, unresolved compatibility, or a limit reached sends the case to staff. The agent cannot broaden its access.

For a real paid pilot, agree and verify a spending limit before enabling it; an illustrative budget might be US$0.25 for estimated model use per run, with a separate limit for paid tools and headroom for billing overshoot. This is an exercise assumption, not a vendor price or guaranteed hard cap. If the controls cannot be verified, keep the exercise manual. The present lesson spends nothing.

This is an authored design, not a record of a tool run.

### Reflection

Where did interpretation help, and where would giving the model more freedom add little? Which fact would you need to re-check before using the same design next month?

### Changed-case transfer

**Make the agent unnecessary**

Changed case: staff restrict C to three approved alternative item IDs, one fixed suitability rule, and an exact date. All three stock checks can run in a known order. Redesign C using the simplest adequate approach and explain what changed. Keep the same permission and completion checks. Submit and self-check this new design separately; opening the example does not establish applied.

### Optional external review

Preview and copy only the case, rubric, and submitted work you choose to share. An external reviewer may use `demonstrated`, `needs_revision`, or `not_assessable` for each criterion, with quoted evidence and one useful next hint. These advisory values must not automatically populate your manual checks. Pasted AI feedback remains `external_ai_unverified`; recording your response does not change its source or prove it correct.

### Sources and attribution

The teaching case, fictional facts, limits, trace, and example answers are original. The following sources inform the concepts; their inclusion does not imply endorsement. Use current official documentation when implementing a real system.

- `D1`: Dan Martell supplied playbook; Deployment Step 2 and explicit workflow design.
- `JJ10`: [Jon Jones, What Is AI Automation? The three-tier explanation; later operator guidance](https://jonjones.ai/ai-automation/what-is-ai-automation/)
- `JJ1`: [Jon Jones autonomous agents guide; tools, context, and one recurring task](https://jonjones.ai/automation/autonomous-ai-agents-guide/)
- `JJ3`: [Jon Jones agentic AI guide; limited tools and documented workflows](https://jonjones.ai/automation/agentic-ai-solopreneurs-guide/)
- `T2`: [Anthropic, Building effective agents; workflows, agents, and simple architectures](https://www.anthropic.com/research/building-effective-agents)
- `T3`: [Claude Code memory documentation; persistent notes are supplied as context](https://code.claude.com/docs/en/memory)
- `original_training_material`: Original fictional case, limits, example answer, and rubric; no observed model run.


## L05 The run says success. Where is the result?

- Lesson ID: `L05`
- Mission ID: `M03-04`
- Module ID: `M03`
- Content version: 1
- Core activity: 25 minutes; allow 35 minutes for the full mission including the transfer task and evidence notes.
- Mode: phone or tablet; no terminal, paid API, or live integration required.

### Goal

Diagnose a misleading success report, verify the destination, place approval before a consequential action, and plan a bounded recovery that avoids duplicates.

### Before you begin

Record a short confidence note before attempting the case. You may pause, skip, or reveal hints. Seeing the example answer creates a guided-practice label or event; it never creates a new evidence state or awards competence. This lesson uses a manual rubric. The app must not infer the quality of free text through keyword matching.

### Case and available information

Original fictional execution trace; no live systems, messages, or API calls.

- Harbour Garden Care is fictional. The intended workflow prepares one internal reply draft for enquiry E-417. A staff member must approve the exact draft revision before any customer send. A notification after an action is an FYI, not prior approval.
- The incoming enquiry record already contains contact_email = lea@example.invalid. A mapping step accidentally omitted that field from the create-draft request. The example address is fictional and must not be contacted.
- This fictional service sometimes returns HTTP 200 with an application error in its response body. Inspect the body to establish whether the operation was accepted. The supplied body explicitly rejects this create operation; a rejected request is not queued for later creation.
- find_draft(source_enquiry_id) is the authoritative lookup for drafts in this exercise. create_draft supports an operation_key: repeating the same operation key returns the existing draft if one was already created, rather than creating a second draft. Do not assume every real API has this feature.
- An explicit validation error needs correction before another attempt. A temporary read failure may justify a bounded retry. After an uncertain write outcome, check for an existing result and reuse the operation key before considering a repeat.
- The current runner relies on the worker to send a failure notification at the end of its own instructions. It has no independent check for a crashed or timed-out worker, missing final record, or missing scheduled run.
- The following trace, lookup, and flawed workflow are authored examples. They are not real execution evidence or instructions to contact a service.

#### Case material

Supplied input: enquiry E-417; contact_email lea@example.invalid; request “Please quote for hedge trimming.”

09:00:00 START run R-28 for E-417; operation_key draft:E-417
09:00:02 WRITE create_draft {source_enquiry_id: E-417, operation_key: draft:E-417, draft_text: “Thank you. Our team will review the request.”}
09:00:03 RESPONSE HTTP 200 {ok: false, error: MISSING_FIELD, field: contact_email}; no draft ID returned
09:00:04 WORKER SUMMARY “Success. The reply draft has been saved.”
09:00:05 PROCESS EXIT 0
09:00:06 PHONE FYI “R-28 completed successfully”
09:02:00 DESTINATION CHECK find_draft(E-417) -> []

No customer-send record or staff approval is supplied.

#### Continuation plan to repair

Proposed continuation: if the worker says success, send the reply to the customer; then create a task asking the manager to approve it. If anything fails, repeat the entire workflow until it works.

### Your task

Give an evidence-based verdict on R-28, replace the continuation plan with at most six steps, and explain how a separate checker notices failure. Plan recovery from the missing field without creating duplicates. State what evidence would finally justify completion. Do not run any tools or send a message.

1. **Did the required outcome occur? Cite the supplied evidence and any remaining unknown**
2. **Up to six steps: save, verify, approve, act, and report in the right order**
3. **Who detects a stalled run, and how would you repair and retry this one safely?**
4. **Write the run outcome now and the evidence required before a later completion claim**

Use short notes or numbered rows. A justified alternative that meets the criteria is valid. This is a design and evidence exercise; writing a plan does not establish that an integration has run.

### Self-check rubric

For your own check, record `met`, `needs_work`, or `uncertain` and point to evidence in your attempt. A missing answer is incomplete evidence, not proof that you lack the skill. Keep consequential unresolved errors visible instead of averaging them into a score.

| Criterion | Evidence to look for | Targeted error |
| --- | --- | --- |
| L05-R1 Outcome verified from evidence | Rejects the success claim using ok:false, the absent draft ID, and the empty authoritative lookup. Does not treat exit 0, a phone alert, or the worker narrative as proof that the draft exists. | `UNVERIFIED_COMPLETION` — consequential if unresolved |
| L05-R2 Cause is specific and supported | Identifies the omitted contact_email mapping despite the value being present in the source. Plans to correct that mapping rather than inventing a contact or blindly repeating the same request. | `MISSING_INPUT` |
| L05-R3 Approval gates the action | Requires recorded staff approval of the exact draft revision before customer sending. Distinguishes a later FYI from that permission. Does not claim a customer message was sent in this trace. | `MISPLACED_APPROVAL` — consequential if unresolved |
| L05-R4 Failure detection survives the worker | Places timeout/missing-result detection in a supervising process or separate checker, with an alert for failed or unresolved runs. Stores actual responses and destination checks rather than only a model summary. | `UNVERIFIED_COMPLETION` — consequential if unresolved |
| L05-R5 Recovery avoids duplicates | Checks the destination by E-417, repairs the mapping, reuses draft:E-417, and verifies the resulting record. Treats an uncertain write outcome as a reason to check first, not blindly create again. | `MISSING_EXCEPTION` — consequential if unresolved |
| L05-R6 Retry and report remain bounded | Limits retries or elapsed time and sends unresolved cases to a named staff role. Records a failed, blocked, or waiting outcome honestly instead of looping or asserting completion. | `UNBOUNDED_EXECUTION` — consequential if unresolved |

### Hint 1

The worker summary, process exit, and phone notification are three reports about the run. Which evidence comes from the destination where the draft should exist?

### Hint 2

Read the response body and compare the request with the source enquiry. Then ask: could a worker that crashes before its last instruction send its own failure alert?

### Hint 3

Put the staff decision before customer sending. For recovery, separate a rejected write from a write whose response was lost: the second may already have created the draft.

### Example answer

Reveal after your attempt or when you deliberately choose guided practice. This is one authored example, not observed AI output or the only valid answer.

#### Verdict
The required draft was not created in this supplied trace. The response body rejected the operation for a missing field, supplied no draft ID, and the authoritative lookup returned no record. The worker's summary, exit 0, and success notification do not overturn that evidence. Nothing supplied proves that a customer message was sent or approved.

#### Corrected path
1. Receive E-417 and its stable operation key. Validate required fields against the incoming record.
2. Prepare and save an internal draft, recording the actual application response.
3. Require an accepted result and read back the saved draft by its identifier or E-417. Check its content, contact, and source ID. If any check fails, stop this path and report the unresolved state.
4. Hold that exact draft revision for staff approval. A changed draft requires a new approval; a task merely filed after sending is not a gate.
5. Only an explicitly authorised sending step may send an approved revision. Record and check the sending service's receipt before describing the message as submitted; that receipt alone does not prove the customer read it.
6. Send an FYI describing the verified state and evidence. The draft-only pilot can end at step 4 as awaiting_staff_approval; it must not claim the customer-send outcome.

#### Failure detection and recovery
A supervising runner or separate checker expects a terminal result and a destination record for each run. It notices a missing run, deadline overrun, crash, or inconsistent success claim without depending on the worker reaching its final alert instruction. It alerts the office coordinator with R-28, E-417, the failed step, and the evidence. An independent check is not infallible, so test its failure path too.

For this error, first repair the mapping from the source contact_email. Check whether a draft exists for E-417, then make one supervised retry using the original operation key draft:E-417. Read back and inspect the returned draft. If it remains rejected or cannot be verified, stop and assign it to the office coordinator. A temporary read outage could receive one retry within a short agreed time limit. Authentication problems or persistent validation errors require intervention, not endless retries.

#### Honest record now
run: R-28; source: E-417; outcome: failed_validation; evidence: application rejection plus no destination draft; next action: correct the mapping and perform one checked retry; customer send: unverified and not authorised by this trace.

A later draft-complete record needs the saved draft ID, the checked fields/revision, check time, and reviewer queue status. These are proposed requirements, not results obtained in this lesson.

### Reflection

Which success signal initially looked convincing? What would happen if the worker died before it could alert you, or if it created the draft but lost the response?

### Changed-case transfer

**The write worked but the response was lost**

Changed trace: the corrected create request times out. The destination lookup then finds draft D-882 for E-417 with the expected contact and draft revision. Staff approval is absent. Decide whether to create again, what to verify, the honest current outcome, and what may happen next. Submit and check this answer separately; no live action is required.

### Optional external review

Preview and copy only the case, rubric, and submitted work you choose to share. An external reviewer may use `demonstrated`, `needs_revision`, or `not_assessable` for each criterion, with quoted evidence and one useful next hint. These advisory values must not automatically populate your manual checks. Pasted AI feedback remains `external_ai_unverified`; recording your response does not change its source or prove it correct.

### Sources and attribution

The teaching case, fictional facts, limits, trace, and example answers are original. The following sources inform the concepts; their inclusion does not imply endorsement. Use current official documentation when implementing a real system.

- `D1`: Dan Martell supplied playbook; testing, measurement, and human review.
- `JJ5`: [Jon Jones October alert self-audit; a failing worker may never reach its own alert step](https://jonjones.ai/ai-automation/daily-tool-thursday-telegram-bot-api-alerts-2026-10-08/)
- `JJ6`: [Jon Jones October approval self-audit; a review task after publication is not a blocking approval](https://jonjones.ai/ai-automation/daily-wednesday-wisdom-human-in-the-loop-ai-agent-2026-10-21/)
- `JJ3`: [Jon Jones agentic AI guide; verification, fallback, and execution logs](https://jonjones.ai/automation/agentic-ai-solopreneurs-guide/)
- `T2`: [Anthropic, Building effective agents; environmental feedback and bounded agent behaviour](https://www.anthropic.com/research/building-effective-agents)
- `original_training_material`: Original fictional API, trace, example answer, and rubric; no observed model run.


## L06 Who keeps the workflow working?

### Lesson metadata

- `lessonId`: L06
- `missionId`: M05-02
- `moduleId`: M05
- `contentVersion`: 1
- `estimatedMinutes`: 30
- `mode`: mobile

This is the core 30-minute exercise within the existing 40-minute M05-02 mission. The remaining mission time supports reflection and project adaptation; this lesson does not add another weekly commitment.

### Goal

Choose an appropriate operating arrangement and write a small pilot offer that makes scope, value, maintenance, costs, approvals, and exit clear.

### Fictional case

- Elveby Property Care is a fictional local maintenance business with four field workers and one office coordinator. All figures are illustrative case data.
- It received 40 service enquiries last month. Ten consecutive enquiries were timed: preparing a checked first reply took an average of eight active minutes per case. Four of those ten initially lacked an address or a usable job description. No conversion or lost-revenue data is available.
- The proposed workflow extracts enquiry details, marks missing information, and prepares a reply draft. It must not send messages, confirm bookings, quote prices, or handle emergency requests automatically.
- The coordinator can operate a company-approved AI tool and review drafts. Nobody currently owns technical maintenance of custom integrations.
- The owner wants predictable commitments and the ability to leave. They are open to paying for defined support. They do not require a custom build or reject managed services.
- Compare three arrangements: the client operates a tool; a consultant delivers a client-owned build; or a provider operates a managed service. None is automatically best.
- A five-minute checked handling time is a proposed pilot target, not an observed result. The pilot must measure actual handling, review, missing details, and corrections.
- This exercise creates a draft offer only. It does not contact the business, connect accounts, set a market price, or authorize live work.

#### Owner and coordinator brief

Owner: I like the idea of faster replies, but I need to understand what we are buying. Is it a tool we use, a system we own, or a service you keep running? Who checks it, who fixes it, what keeps costing money, and what happens if we stop? Please suggest something small enough to judge before we commit.

Coordinator: I can review every draft. I cannot promise to repair APIs or be on call. We can keep handling enquiries manually during a trial.

### Learner task

Compare the three arrangements, choose a defensible first step, and draft a bounded pilot offer. Keep mobile inputs short. Use the case evidence; there is no automatic correct choice and no need to invent a price.

1. **Compare the three arrangements and choose one, in three short sentences**

2. **Pilot offer, up to 180 words: scope; who operates, fixes, pays, approves, and can exit/export**

3. **Up to 100 words: baseline, target, value limits, and what can be reused versus rechecked**

Aim for a reasoned choice and a usable small offer, not elaborate contract wording. No numeric fee is required. Different arrangements can satisfy the rubric when responsibilities and tradeoffs are credible.

### Rubric

| ID | Criterion | Demonstrated when | Gap tag |
| --- | --- | --- | --- |
| L06-R1 | Arrangement fits the case | Compares all three arrangements and justifies the first step using volume, staff capability, uncertainty, and preferences; does not declare one model universally superior. | `SOLUTION_FIRST` |
| L06-R2 | Bounded pilot and approval — critical | Names a small intake-and-draft scope, a review step, a decision point, and exclusions; does not promise automatic sending, booking, pricing, or emergency handling. | `UNSUPPORTED_COMMITMENT` |
| L06-R3 | Operations and maintenance owner — critical | Names who runs and checks the workflow, who fixes pilot problems, the support window or limit, the manual fallback, and what happens after the pilot. No responsibility is silently left unowned. | `UNOWNED_MAINTENANCE` |
| L06-R4 | Costs, control, and exit | Separates build or setup charges, approved tool usage, and ongoing support; identifies account control, exportable deliverables, and any limits rather than promising unrestricted ownership automatically. | `UNOWNED_MAINTENANCE` |
| L06-R5 | Value is tested | Distinguishes the observed eight-minute sample from the proposed five-minute target; measures checked effort and quality, includes running and support costs, and does not turn hypothetical capacity into guaranteed cash or revenue. | `UNCLEAR_SUCCESS` |
| L06-R6 | Reuse has boundaries | Names reusable components and at least two business-specific rules or permissions requiring fresh examples and checks before reuse. | `MISSING_EXCEPTION` |

Record each manual rubric check as `met`, `needs_work`, or `uncertain`, with evidence from your answer. Optional external AI feedback retains its separate advisory values (`demonstrated`, `needs_revision`, or `not_assessable`) and `external_ai_unverified` provenance; it never fills or replaces the manual checks automatically. The authored comparison below is an example, not personalized assessment. An unresolved critical issue is not offset by good wording elsewhere.

### Progressive hints

#### Hint 1

Owning an account or a build does not identify who will notice and fix a failure. Put a person or agreed role next to each responsibility.

#### Hint 2

Start from this firm’s volume, staff capability, and need for reviewed drafts. A small trial may answer the value question before a custom connection is necessary.

#### Hint 3

Separate the one-off fee, ongoing tool usage, and support work. Then ask what remains usable at exit and which business rules must be revalidated for another client.

### Worked example

#### Compare the arrangements

| Arrangement | Fit for this case | What must be agreed |
| --- | --- | --- |
| Client-operated tool | A sensible first pilot: the coordinator can run drafts in a company-approved tool and check them before use. | Who maintains the prompt and rules, who handles a tool problem, and which records can be exported. |
| Commissioned client-owned build | Consider after a useful, stable workflow is demonstrated. A custom integration is not yet justified by the evidence. | Client account control, the delivered configuration or code, operating instructions, and a capable maintenance owner after the build. |
| Managed service | A valid alternative if the firm wants someone else to operate it and the value supports the ongoing cost. | Service scope, response windows, who approves replies, data access, and what the client receives when the service ends. |

#### Example pilot offer

We propose a two-week pilot for up to ten suitable enquiries: an intake summary and a reply draft in your approved tool. No automatic sending, booking, pricing, or emergency handling is included.

Your coordinator runs each case, checks details, approves the reply, and uses the existing manual process when the draft is unsuitable. We configure the pilot, review recorded issues in two agreed weekly support windows, and fix defects within the pilot scope. No out-of-hours response is included. After the pilot, continuation requires a named maintenance owner; additional support or changes need a separate agreement.

The pilot fee is agreed before work starts. You pay approved tool usage directly, within an agreed cap. Your accounts remain yours. You retain the intake records, prompt, business rules, and operating note in agreed portable formats. At exit, we return the agreed records and remove our access; any vendor-specific export limit is disclosed before starting.

We compare checked handling time, missing details, and substantive corrections with the baseline, then decide whether to stop, revise, or extend.

#### Value note

Observed baseline: eight minutes per enquiry across ten cases. Five minutes including review is a target. At 40 comparable enquiries, that would release 120 minutes monthly, not guaranteed cash or revenue. Test actual time and quality and include setup, support, and tool costs.

#### Reuse note

Reuse intake structure, missing-field checks, draft format, test patterns, and the handover template. Reconfirm services, service area, required details, approvals, permissions, and escalation contacts using fresh examples. Copying a configuration does not establish client fit.

A different arrangement can be defensible if the learner supplies a credible operator, support plan, and value argument. This is an authored example, not a real quotation or a completed client engagement.

### Reflection

If you were unavailable next week, which responsibility would become unclear? Which promise in your offer is supported by evidence, and which is a condition you still need to agree?

### Changed-case transfer

#### The internal operator is leaving

Changed fictional case: enquiry volume is now 200 per month, the coordinator is leaving, and the owner asks you to take over daily operation. No replacement reviewer is named. Rewrite only your arrangement choice and the operating/support paragraph. Identify what must be resolved before extending the service, what new value evidence is needed, and which existing components you can retain. Keep customer commitments subject to a named approval process. Submit this as a separate transfer attempt; reading the example answer or completing a same-case revision does not establish transfer.

### Saved evidence

- Arrangement comparison and rationale.
- Draft pilot offer and revisions.
- Value assumptions and reuse boundaries.
- Criterion-level review with its source.
- A separately submitted changed-case attempt and review.

### Sources and attribution

The articles inform the distinctions between delivery arrangements, continuing operations, and bounded offers. The business, figures, proposed offer, calculations, rubric, and exercises are original teaching material. The lesson does not adopt the articles’ market prices or broad autonomy claims.

- **JJ2:** [AI Automation Agency](https://jonjones.ai/business/ai-automation-agency-autonomous-systems-2026/), sections on a first narrow build and ongoing services.
- **JJ7:** [AI Automation Consultant](https://jonjones.ai/business/ai-automation-consultant/), sections on maintenance and handover.
- **JJ8:** [AI Automation Services](https://jonjones.ai/business/ai-automation-services/), comparison of purchasing arrangements and exit responsibilities.
- **JJ9:** [AI and Consulting](https://jonjones.ai/business/ai-and-consulting-solopreneurs-guide-2026/), discussion of defined consulting packages.

