# AI Business Practice

A personal phone and tablet learning app. It is built from the handoff package in [`handoff/`](handoff/README.md), revision 1.2. The app has three destinations, **Today**, **Course** and **My Work**, plus **Backup & restore**. It contains six interactive lessons, L01–L06, and the other 22 missions are shown as outlines.

It is a set of static files with no build step, no dependencies, no backend, no account, no analytics and no AI API.

## Run it

```sh
cd ai-practice
python3 -m http.server 8080      # or any static file server
# open http://localhost:8080/
```

The app loads its lesson files with `fetch`, so it has to be served over HTTP rather than opened as a `file://` page. Any static host works, for example GitHub Pages pointed at this repository, which would serve the app at `/ai-practice/`. Hosting is your decision. Nothing has been published.

## Tests

```sh
npm test            # node --test: data layer, 20 checks
npm run test:e2e    # Playwright + Chromium: full flow at 360px and 768px, 19 checks each
```

The data tests cover these areas:

- **Content:** lesson-to-mission mapping, rejection of duplicate lesson IDs, and invalid content bundles.
- **Evidence states:** every state transition, and confirmation that hints, the model answer, pasted feedback and drills never advance a state.
- **Revisions:** revision chains, and imported state labels being recomputed rather than trusted.
- **Saving:** save and resume, a failed write, a write that reads back wrong, blocked storage, unreadable saved data, and a conflict with another tab.
- **Backups:** an export/restore round trip, malformed or unsupported files, broken references, conflict decisions, the bundled synthetic sample, and archiving of unknown lessons.
- **Content changes:** preserving work when a lesson's content version changes.
- **Outputs:** the review packet and the Markdown export.

The end-to-end test runs the complete L01 loop: confidence, case, selections and written reply, then submit, rubric, external review, feedback response, targeted drill and transfer, giving **Applied**. It also runs these checks:

- **Drafts and revisions:** drafts survive navigation and reload, and revising creates revision 2.
- **Assistance labels:** a model answer revealed before submitting labels the attempt as guided practice.
- **Offline and failed writes:** editing still works offline once the page has loaded, and a failed write shows "Not saved" with an export route.
- **Backup and restore:** export shows its scope, a second browser profile is empty, and restore into an empty profile reproduces the exported records exactly.
- **Bad imports:** malformed and unsupported-version imports leave the existing work untouched.
- **Conflicts and markup:** a conflicting import needs an explicit choice, and imported or pasted markup stays inert.
- **Clipboard:** when copying is blocked, the selectable-text fallback appears.
- **Course:** it shows 6 lessons and 22 outlines, and skipping is labelled as skipped.
- **Health:** no horizontal scrolling and no script errors.

## Not verified

- **Real devices:** the real software keyboard on iOS or Android has not been tested; headless Chromium cannot emulate it. Text fields have scroll margins, and the sticky header stops being sticky while you type on phones. Try one full lesson on your own phone and tablet.
- **Other browsers:** only Chromium was tested. Safari and Firefox were not.
- **Dark mode:** it was checked visually on a few screens only.

## Structure

| Path | Role |
| --- | --- |
| `content/*.json` | Lesson bundles (copied unchanged from the handoff), `curriculum.json` (generated from `curriculum.md`, 28 missions), `curriculum-notes.json` (CP01–CP05 planned briefs and optional readings) and `diagnostic-map.json`. |
| `js/content.js`, `js/validate.js` | Load and validate content, combine bundles by stable ID and reject duplicates. |
| `js/model.js`, `js/evidence.js` | Progress operations and evidence states derived from revision-linked events. |
| `js/store.js` | Local saving: verified writes, error and conflict states, and a recoverable previous copy. |
| `js/backup.js`, `js/packet.js` | JSON backup, Markdown export, the import plan/conflicts/apply flow, and the external review packet. |
| `js/views/*`, `js/ui.js`, `js/dom.js` | Views. All text is placed with `textContent`, and no untrusted string is ever assigned to `innerHTML`. |
| `handoff/` | The design handoff this app implements: spec, acceptance criteria, schemas and sample. |

A Content-Security-Policy restricts the page to its own origin, so the app cannot make network calls to other sites. External reading links open in a new tab.

## Decisions taken where the spec left room

- **Skipping** is a mission-level event in `missionEvents` and is never an evidence state. It also works for outline missions.
- **Confidence and predicted difficulty** are stored as `preAttempt` on the attempt. They are compared descriptively with your rubric and never produce a score.
- **Targeted drills** are stored in `attempt.drills`. **Transfer attempts** are stored in the `transfer_checked` event evidence, with a fictional, simulated or live label.
- **Self-review against the example answer** uses the provenance `self_review`. Pasted AI reviews use `external_ai_unverified`. Lines in the form `criterion | result | evidence` are kept as advisory `criterionReviews` and never fill in your own rubric check.
- **Submissions** store a `contentSnapshot` of the field and rubric labels, so old revisions stay readable if the content changes.
- **Free text is never assessed automatically.** Only L01's multi-select is checked against its answer key.
- **Offline:** there is no service worker, so the app does not promise offline reloading.

These extension fields sit alongside the fields required by `handoff/schemas/progress.schema.json`. Backups still validate against that schema.

## Limits

- Saving is limited to this browser profile. Nothing syncs between phone and tablet; use export and import to move work.
- Local storage is not encryption or access control.
- The 22 outline missions and the CP01–CP05 briefs are not lessons.
- No state means competence or readiness to sell.

## Next smallest step

Run L01 on your own phone and tablet and note any friction, especially with the keyboard, copying the review packet, and moving work between devices with export/import. Then fix what you observe before authoring the next lesson. The suggested next lesson is CP01 inside M01-02, using the same lesson contract.
