# Andrew Dunn course: assessment and selected additions

Research date: 2026-11-02. Package revision: 1.2.

## Decision

Add the course's strongest discovery and client-decision practices to the existing curriculum. The meaningful additions are comparing different accounts of the work, validating opportunity priorities with the client, explaining value honestly, and working with an implementation partner. Keep Dan Martell's organising framework and Jon Jones's operating lessons.

This is a refinement of the existing 28 missions. Six lessons remain fully authored; the other 22 remain outlines. The new `content/consulting-practice-backlog.md` contains five prioritised authoring briefs and two optional case variants. They are planned content, not completed interactive lessons or additional prerequisites.

## Material reviewed and limits

The main source is Martin's supplied transcript of [The ULTIMATE AI Consulting Course For Beginners (2026)](https://www.youtube.com/watch?v=5aZZNskTsx0), attributed in indexed video metadata to Andrew Dunn / AI Consulting [AD1]. The complete supplied text was reviewed. Direct video retrieval was unavailable; on-screen slides, execution records, audio, downloadable workflows and templates were not independently inspected. Transcript wording may contain transcription errors. No timestamps are asserted as independently verified.

The creator's own newsletter establishes his commercial teaching context [AD2], not independent verification of client outcomes. The research report associated with the 95% claim and official n8n, Vapi and Anthropic documentation were checked where relevant. Source IDs and links are in `framework-and-sources.md`.

## What contributes to Martin's app

| Selected idea | Existing missions | Treatment |
| --- | --- | --- |
| Understand both the business goal and daily work | M01-02, M01-03 | Compare an owner's account with a task operator's account and a concrete example. Investigate disagreements without assuming either person is wrong. |
| Rank opportunities and revise them with the client | M01-05, M02-05 | Use impact and effort alongside confidence, dependencies, consequence of errors and willingness to adopt. Keep options provisional until checked. |
| Present a transparent business case | M04-04 | Separate capacity, actual cost avoidance and additional contribution. Use a declared time period, assumptions and complete costs. |
| Give the client a clear decision brief | M05-01 | Summarise scope, evidence, options, proposed pilot and next decision. A readable page or short explanation can serve the purpose. |
| Offer a defined assessment and coordinate a capable delivery partner | M05-02, M05-03 | Make the assessment useful independently of an implementation sale. Assign feasibility review, acceptance, support, client communication, ownership and exit. |

The interview and opportunity sections are the strongest fit. The later agent explanations mostly reinforce L04–L06. A large new agent or tool-selection course would duplicate existing objectives.

The transcript's suggestion to begin with an existing network fits Martin's local direction. His transport and customer-service experience can supply concrete questions and process examples. It does not automatically establish expertise in a new sector or technical implementation. Discovery practice can begin while those skills develop.

## Claims that need qualification

### The 95% figure

Project NANDA's July 2025 preliminary report combined 52 organisation interviews, 153 conference-survey respondents and 300+ public initiatives. It discusses reported productivity, deployment and financial outcomes, with different populations and success definitions across passages. Its limitations include selection bias and a short observation period. It does not establish a universal failure rate for all AI projects or prove that missing maintenance causes the reported percentage. A maintenance contract is not a guarantee of success. [R1, pp. 2–3, 6–7, 24]

The app should teach Martin to ask what a statistic measures, whose work it describes, and whether it supports the decision at hand. It should not teach 95% as a forecasting constant.

### Technical expertise and delivery responsibility

Outsourcing a build can be a valid operating model. The consultant still needs enough technical understanding, or a named competent partner, to assess feasibility, define acceptable outcomes, explain limitations and coordinate delivery. The app should teach this judgment without requiring Martin to become a full-time developer before conducting discovery conversations.

Maintenance is one part of a viable service. It cannot by itself establish demand, make inadequate data sufficient, secure staff adoption or prove the predicted benefit. L06 already assigns operation, support and exit explicitly; the new brief extends that reasoning to subcontracted delivery.

### Prices, scale and certainty

Treat the quoted audit fees, contract values, margins, interview counts and two-week schedule as the creator's examples. They are not evidence of a minimum price or suitable scope in Martin's local market. A small, defined diagnostic may be more appropriate than a company-wide audit. A separate paid audit is an option rather than a universal first sale.

The broad consulting-market comparison does not establish demand for a particular local offer. Claims of no competition, guaranteed outcomes, perfect agents and unbreakable workflows should not become teaching criteria. This review does not independently verify the creator's client results, market-size figures or financial claims.

## Value and outreach arithmetic

The transcript's example gives five employees four hours each per week. At approximately $28.85 per hour over 52 weeks, that is about $30,000 of labour-time value. If salaries and paid hours remain unchanged, it is released capacity rather than an automatic reduction in expenditure.

The subsequent move to $24,000 is not explained clearly in the supplied text. Dividing $24,000 by a $5,000 cost gives 480%, but it is net ROI only if $24,000 is already the relevant net gain. Use the app's explicit convention:

`Year-one ROI = (year-one financial benefits − all defined year-one costs) / all defined year-one costs × 100%`

Keep the financial-benefit calculation separate from the capacity estimate. Include implementation, tools, review, correction, training and maintenance where applicable. Show setup timing and the benefit period. A zero denominator means this ratio is undefined; it is not a reason to advertise infinite ROI. This simple comparison is not a discounted cash-flow model.

Freed sales time also does not automatically produce a fixed amount of extra revenue per hour. Identify available demand, conversion assumptions and delivery capacity; use incremental contribution after relevant costs. Do not count the same freed time both as eliminated labour cost and as staff time used for additional work. Precision should follow measurement, not the wish to make a claim more persuasive.

The supplied transcript describes 153 campaign outcomes first as clients and later as opportunities. At 14,100 emails, 153 is approximately 1.09%; an 8.7% reply rate would imply about 1,227 replies if it uses the same denominator. These can describe different funnel stages but cannot be substituted for one another. The underlying campaign data was not audited. A later optional exercise can distinguish replies, qualified conversations, signed clients and paid work without adopting the creator's conversion claims as a benchmark.

## How to use the demonstrations

- **Short workflows:** n8n documents execution failures and error handling [T5]. A small diagram is useful for explanation; it does not establish correct operation. Keep L05's destination checks and a meaningful failure case.
- **Voice booking:** the supplied dialogue alone does not establish a checked slot, capacity or saved reservation. That is a limit of the evidence reviewed, not proof that the actual workflow lacks them. Vapi separates availability checking from event creation [T6] and advises confirming a booking only after the backend confirms it, with important rules enforced in the service [T7].
- **Policy-based support:** the transcript alternates between sending replies and drafting plus notification. Describe only the demonstrated outcome. Retrieval provides relevant external context [T8]; freshness, authority and correct application still need checking. An optional stale-policy case fits L04/L05.
- **Agent teams:** dividing work into subagents is an architecture choice. Preserve L04's comparison with rules, a fixed workflow and human handling, consistent with Anthropic's architectural guidance [T2].

Model rankings, latency, subscription prices and historical outreach-platform comparisons are excluded from core lesson facts. Verify current official documentation if Martin later chooses one of those tools.

## What remains optional

Bulk outreach, large prospect databases, automatic hiring screening, six-agent departments and extensive personal-assistant integrations are later project ideas. They are not needed to learn the first discovery conversation or deliver a useful small improvement. No real messages, account connections, applications or hiring decisions are performed by this learning app.

The useful contribution is a clearer client conversation and decision process. The next build milestone remains the original complete L01 loop, with the new briefs informing later content authoring.
