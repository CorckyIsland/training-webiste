# AI business practice acceptance criteria

## Release boundary

The first build delivers one lesson loop with local persistence, followed by two additional starter lessons and three applied lessons. It is not a finished 28-lesson course. Use fictional test data and preserve original work during import and migration checks.

## One complete learning loop

- Today opens the active mission and shows its specific outcome. Course allows browsing, skipping, and repeating without completion gates.
- L01 maps to M00-01, L02 to M01-01, L03 to M02-02, L04 to M02-03, L05 to M03-04, and L06 to M05-02. The remaining 22 missions are visibly identified as outlines until written. Both content bundles load with unique lesson IDs; adding the second bundle preserves prior L01–L03 work.
- CP01–CP05 remain planned content notes within those missions. They do not appear as five additional completed lessons or create new progress-schema IDs. They add no compulsory app feature or extra workload to the first release.
- A learner records confidence, submits work, completes a rubric check, reviews feedback, follows a relevant drill, and saves a transfer attempt.
- A keyed choice error can link to a named error and drill. Free text remains unassessed unless a manual or external review is recorded. The interface never presents keyword matching as semantic assessment.
- Feedback states what was observed, what is uncertain, and what to practise. Completion is not displayed as proof of expertise or readiness to sell.

## State and evidence integrity

- Opening a lesson produces seen only. Submission produces attempted; a documented rubric check produces self_checked; an explicit feedback response produces reviewed; a checked transfer task produces applied.
- Hints, model answers, copied prompts, pasted feedback, and navigation do not advance these states.
- Editing and resubmitting assessed work creates a new revision. Earlier feedback remains tied to its original snapshot and cannot silently certify the new revision.
- External feedback retains external_ai_unverified provenance after the learner records their response. Fictional and simulated evidence stays labelled; neither becomes a live integration result.
- L04–L06 use manual criteria for written reasoning. A learner can justify simpler rules or a human route without being penalised for declining an agent. L05's supplied execution trace remains fictional evidence. L06 accepts different commercial arrangements when operation, support, approval and value are defensible.

## Save, resume, and recovery

- Enter draft text and notes, wait for the confirmed save indicator, navigate away, reload, and reopen the app in the same browser. The confirmed work and state return intact.
- Interrupt a write or make storage unavailable. The app reports a save problem, retains the last valid snapshot, and provides an export or copy route where possible. It never displays “Saved” for an unsuccessful write.
- Saving is labelled local to the device/browser. A second browser does not appear to contain the first browser's work. Clear backup instructions explain this limitation without implying cloud sync.
- Export a JSON backup containing drafts, submitted revisions, notes, reviews, measurements, and content versions. Restore it into an empty profile and compare those records. Readable project exports also contain the selected work and its context.
- Import malformed data, an unsupported schema, and a file with conflicting record IDs. Existing work remains unchanged until validation and explicit confirmation. Conflicts are visible, and replacement requires a deliberate choice.
- Import a record for an unknown lesson and update a lesson's rubric version. Historical evidence remains available and distinguishable; no record is silently dropped or reassigned.

## Phone and tablet flow

- At representative 360-pixel phone and 768-pixel tablet viewport widths, complete an attempt, rubric, feedback response, export, and restore without horizontal page scrolling or a terminal.
- With the software keyboard open, the active field and essential actions remain reachable. Switching destinations preserves the draft. Controls support touch and keyboard focus; no essential action requires hovering or dragging.
- Copy a review packet where clipboard access is allowed, then deny clipboard access and use selectable text instead. Both routes expose the exact information being shared.
- An external integration activity states its environment requirement before starting. Its phone-accessible alternative describes its narrower outcome and cannot award a completed live integration.

## Privacy and network scope

- Review prompts and exports leave the app only through explicit user actions. No paid AI call, analytics request, account, or public sharing is needed for the starter loop.
- Imported markup and pasted AI feedback display as inert content. They cannot run scripts or modify unrelated app data.
- Disconnect the network after opening a lesson. Draft editing and local saving still work for that loaded content. The app does not promise that offline reloading, unopened lessons, external AI, or external builders will work.

## Focused verification

Prioritise a small set of tests for save/resume, failed writes, export/import round trips and conflicts, state transitions, and content-version preservation. Perform one complete phone flow and one tablet flow, including keyboard and clipboard fallback. Repeat only when a change affects these behaviours or exposes a concrete regression. Record any unverified behaviour honestly in the handoff.
