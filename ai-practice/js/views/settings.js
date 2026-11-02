import { h, downloadText, copyText } from "../dom.js";
import { buildBackup, summarise, buildMarkdown, parseImport, planImport, applyImport, PROVENANCE_LABEL } from "../backup.js";
import { blankProgress } from "../model.js";
import { pills, inlineMessage, toast } from "../ui.js";
import { formatTime, nowIso } from "../util.js";
import { STATE_INFO } from "../evidence.js";

let pending = null; // { data, plan, decisions, warnings, fileName }

const THEME_KEY = "ai-business-practice:theme";

function today() { return nowIso().slice(0, 10); }

export function renderSettings(app) {
  const { store } = app;
  const view = h("div", { class: "stack-lg" });
  view.dataset.title = "Backup & restore";
  view.appendChild(h("div", null, h("p", { class: "eyebrow" }, "Backup, restore and settings"), h("h1", null, "Backup & restore")));

  view.appendChild(h("div", { class: "card stack" },
    h("p", null, h("strong", null, store.status.kind === "saved" ? "Saved on this browser" : store.status.kind === "saving" ? "Saving…" : "Not saved"), store.status.lastSavedAt ? ` · last saved ${formatTime(store.status.lastSavedAt)}` : ""),
    h("p", { class: "small" }, `Last export: ${store.meta.lastExportAt ? formatTime(store.meta.lastExportAt) : "never"}.`),
    h("p", { class: "small muted" }, "Work is kept in this browser profile on this device only. A different browser, another device, private browsing or clearing site data will not have it, and the browser itself may remove stored data under storage pressure. An export is a file you keep. It is not cloud sync, and the phone and tablet do not sync automatically.")));

  if (store.status.unreadable !== null) view.appendChild(unreadableSection(app));
  view.appendChild(exportSection(app));
  view.appendChild(markdownSection(app));
  view.appendChild(importSection(app));
  view.appendChild(previousSection(app));
  view.appendChild(themeSection());
  view.appendChild(aboutSection(app));
  view.appendChild(deleteSection(app));

  const target = { export: "sec-export", import: "sec-import" }[app.route.params[0]];
  if (target) setTimeout(() => { const el = document.getElementById(target); if (el) { el.scrollIntoView({ block: "start" }); el.focus({ preventScroll: true }); } }, 0);
  return view;
}

function unreadableSection(app) {
  const area = h("textarea", { class: "code", readonly: true, "aria-label": "Unreadable saved data" });
  area.value = app.store.status.unreadable;
  return h("section", { class: "banner error stack" },
    h("h2", null, "Saved data could not be read"),
    h("p", null, "Nothing has been changed and saving is paused. Copy the text below somewhere safe if it matters. Then you can set it aside (it stays in this browser under a separate name) and start with empty work, or import a backup."),
    area,
    h("div", { class: "row" },
      h("button", { type: "button", onclick: async () => { if (!(await copyText(area.value))) { area.focus(); area.select(); toast("Copy blocked — select the text and copy it manually."); } else toast("Copied."); } }, "Copy it"),
      h("button", { type: "button", class: "primary", onclick: () => { if (confirm("Set the unreadable data aside and start fresh?")) { app.store.setAsideUnreadable(); app.rerender(); } } }, "Set aside and start fresh")));
}

function exportSection(app) {
  const { store, content } = app;
  const s = summarise(store.data);
  const textBox = h("div");
  const prov = Object.entries(s.feedbackByProvenance).map(([k, n]) => `${n} ${PROVENANCE_LABEL[k] || k}`).join(", ");
  const mark = () => store.updateMeta({ lastExportAt: nowIso() });
  return h("section", { class: "stack", id: "sec-export", tabindex: "-1" },
    h("h2", null, "Export a full backup (JSON)"),
    h("p", null, "Use this to restore your work later or move it to another device. What will be included:"),
    h("ul", { class: "small" },
      h("li", null, `${s.drafts} draft(s) and ${s.revisions} submitted revision(s)${s.openedOnly ? `, plus ${s.openedOnly} opened-but-not-submitted record(s)` : ""}`),
      h("li", null, `${s.events} activity events, ${s.rubricChecks} rubric checks, ${s.transfers} transfer attempt(s), ${s.drills} drill(s)`),
      h("li", null, `${s.feedback} feedback item(s)${prov ? ` — ${prov}` : ""}, with their original source kept`),
      h("li", null, `${s.notes} note(s) and ${s.measurements} measurement(s)`),
      h("li", null, `Content versions used: ${s.contentVersions.length ? s.contentVersions.join(", ") : "none yet"}`),
      h("li", null, "Not included: your theme choice and this browser’s reminders about backups.")),
    h("div", { class: "row" },
      h("button", { type: "button", class: "primary", onclick: () => {
        const text = JSON.stringify(buildBackup(store.data, content), null, 2);
        downloadText(`ai-business-practice-backup-${today()}.json`, text, "application/json");
        mark();
        toast("Backup file created. Check your downloads.");
        app.rerender({ keepScroll: true });
      } }, "Download backup"),
      h("button", { type: "button", onclick: () => {
        const text = JSON.stringify(buildBackup(store.data, content), null, 2);
        textBox.textContent = "";
        const area = h("textarea", { class: "code", readonly: true, "aria-label": "Backup text" });
        area.value = text;
        const msg = h("div");
        textBox.appendChild(h("div", { class: "stack" }, area, msg, h("div", { class: "row" },
          h("button", { type: "button", onclick: async () => {
            if (await copyText(text)) { mark(); inlineMessage(msg, "Copied. Paste it somewhere you keep files, such as a note or email to yourself.", "info"); }
            else { inlineMessage(msg, "Copy is blocked here. Select the text in the box and copy it manually.", "warn"); area.focus(); area.select(); }
          } }, "Copy"),
          h("button", { type: "button", onclick: () => { area.focus(); area.select(); } }, "Select all"))));
      } }, "Show as text")),
    textBox);
}

function markdownSection(app) {
  const { store, content } = app;
  const p = store.data;
  const ids = [...new Set(p.attempts.filter(a => a.submittedAt).map(a => a.lessonId))]
    .sort((a, b) => (content.lessonOrder.indexOf(a) + 1 || 99) - (content.lessonOrder.indexOf(b) + 1 || 99));
  const selected = new Set(ids);
  let includeNotes = true, includeMeasurements = true;
  const out = h("div");
  const box = h("section", { class: "stack" }, h("h2", null, "Readable export (Markdown)"),
    h("p", null, "A readable copy of selected work with its lesson context — for reading or sharing deliberately. It cannot be imported back; use the JSON backup for that."));
  if (!ids.length) { box.appendChild(h("p", { class: "muted" }, "No submitted work yet.")); return box; }
  box.appendChild(h("fieldset", { class: "stack" }, h("legend", null, "Include"),
    h("div", { class: "choices" },
      ids.map(id => {
        const l = content.lessons.get(id);
        const input = h("input", { type: "checkbox", checked: true, onchange: () => { if (input.checked) selected.add(id); else selected.delete(id); } });
        return h("label", { class: "choice" }, input, h("span", null, `${id} · ${l ? l.title : "archived lesson"}`));
      }),
      (() => { const i = h("input", { type: "checkbox", checked: true, onchange: () => { includeNotes = i.checked; } }); return h("label", { class: "choice" }, i, h("span", null, "General notes and mission notes")); })(),
      (() => { const i = h("input", { type: "checkbox", checked: true, onchange: () => { includeMeasurements = i.checked; } }); return h("label", { class: "choice" }, i, h("span", null, "Measurements")); })())));
  box.appendChild(h("button", { type: "button", onclick: () => {
    const md = buildMarkdown(store.data, content, { lessonIds: ids.filter(id => selected.has(id)), includeNotes, includeMeasurements });
    out.textContent = "";
    const area = h("textarea", { class: "code", readonly: true, "aria-label": "Markdown preview" });
    area.value = md;
    const msg = h("div");
    out.appendChild(h("div", { class: "stack" }, h("p", { class: "small muted" }, "Preview — this is exactly what the file will contain."), area, msg, h("div", { class: "row" },
      h("button", { type: "button", class: "primary", onclick: () => { downloadText(`ai-business-practice-work-${today()}.md`, md, "text/markdown"); toast("Markdown file created."); } }, "Download .md"),
      h("button", { type: "button", onclick: async () => { if (!(await copyText(md))) { inlineMessage(msg, "Copy is blocked here. Select the text and copy it manually.", "warn"); area.focus(); area.select(); } else inlineMessage(msg, "Copied.", "info"); } }, "Copy"))));
  } }, "Preview readable export"));
  box.appendChild(out);
  return box;
}

function importSection(app) {
  const { store, content } = app;
  const result = h("div", { class: "stack" });
  const fileInput = h("input", { type: "file", accept: ".json,application/json", "aria-label": "Choose a backup file", onchange: async () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { pending = null; showResult({ ok: false, errors: ["The file is larger than 5 MB."], warnings: [] }); return; }
    const text = await f.text();
    check(text, f.name);
  } });
  const paste = h("textarea", { class: "code", placeholder: "…or paste backup text here", "aria-label": "Paste backup text" });

  function check(text, name) {
    const parsed = parseImport(text);
    if (!parsed.ok) { pending = null; showResult(parsed); return; }
    const plan = planImport(store.data, parsed.data, content);
    pending = { data: parsed.data, plan, decisions: {}, warnings: parsed.warnings, name };
    showResult(parsed);
  }

  function showResult(parsed) {
    result.textContent = "";
    if (!parsed.ok) {
      result.appendChild(h("div", { class: "banner error", role: "alert" },
        h("p", null, h("strong", null, "This file cannot be imported. Nothing was changed.")),
        h("ul", { class: "small" }, parsed.errors.map(e => h("li", null, e)))));
      return;
    }
    result.appendChild(planView(app, () => { pending = null; app.rerender({ keepScroll: true }); }));
  }

  const box = h("section", { class: "stack", id: "sec-import", tabindex: "-1" },
    h("h2", null, "Import or restore a backup"),
    h("p", null, "The file is checked first. You will see what would be added and which records conflict before anything changes. Imported text is shown as plain text and never run."),
    h("label", { class: "field" }, h("span", { class: "field-label" }, "Backup file"), fileInput),
    paste,
    h("button", { type: "button", onclick: () => check(paste.value, "pasted text") }, "Check pasted text"),
    result);
  if (pending) result.appendChild(planView(app, () => { pending = null; app.rerender({ keepScroll: true }); }));
  return box;
}

function planView(app, done) {
  const { store, content } = app;
  const { plan, data, decisions, warnings, name } = pending;
  const conflicts = plan.items.filter(i => i.status === "conflict");
  const msg = h("div");
  const wrap = h("div", { class: "card stack" },
    h("h3", null, `Checked: ${name}`),
    h("p", null, `${plan.counts.new} new record(s) will be added. ${plan.counts.identical} identical record(s) will be skipped. ${plan.counts.conflict} record(s) conflict with work on this browser.`));
  if (data.exportedAt) wrap.appendChild(h("p", { class: "small muted" }, `File exported ${formatTime(data.exportedAt)}.`));
  if (warnings.length) wrap.appendChild(h("ul", { class: "small" }, warnings.map(w => h("li", null, w))));
  if (plan.unknownLessons.length) wrap.appendChild(h("p", { class: "notice" }, `Work for ${plan.unknownLessons.join(", ")} is not part of this app’s lessons. It will be kept unchanged as archived work.`));
  if (plan.versionNotes.length) wrap.appendChild(h("ul", { class: "small" }, plan.versionNotes.map(v => h("li", null, v))));
  if (plan.stateCorrections.length) {
    wrap.appendChild(h("div", { class: "notice" },
      h("p", null, "State labels in the file are recomputed from the recorded evidence:"),
      h("ul", { class: "small" }, plan.stateCorrections.map(c => h("li", null, `${c.lessonId}: file says “${STATE_INFO[c.label] ? STATE_INFO[c.label].label : c.label}”, evidence supports “${STATE_INFO[c.derived].label}”`)))));
  }
  if (plan.profileDiffers) wrap.appendChild(h("p", { class: "small muted" }, "The file’s profile settings differ; this browser keeps its own profile."));
  if (conflicts.length) {
    wrap.appendChild(h("h3", null, "Choose for each conflict"));
    const radios = [];
    wrap.appendChild(h("div", { class: "row" },
      h("button", { type: "button", onclick: () => { conflicts.forEach(c => { decisions[c.key] = "local"; }); radios.forEach(r => { r.checked = r.value === "local"; }); } }, "Keep all local"),
      h("button", { type: "button", onclick: () => { conflicts.forEach(c => { decisions[c.key] = "imported"; }); radios.forEach(r => { r.checked = r.value === "imported"; }); } }, "Use all imported")));
    for (const c of conflicts) {
      const fs = h("fieldset", { class: "card tight stack" }, h("legend", null, c.label),
        h("p", { class: "small muted" }, `On this browser: ${describeVersion(c.local)} · In the file: ${describeVersion(c.imported)}`));
      const opts = h("div", { class: "pills" });
      for (const [val, label] of [["local", "Keep local"], ["imported", "Use imported"]]) {
        const r = h("input", { type: "radio", name: `conf-${c.key}`, value: val, checked: decisions[c.key] === val, onchange: () => { decisions[c.key] = val; } });
        radios.push(r);
        opts.appendChild(h("label", { class: "pill" }, r, h("span", null, label)));
      }
      fs.appendChild(opts);
      wrap.appendChild(fs);
    }
  }
  wrap.appendChild(h("p", { class: "small muted" }, "Before importing, you can download a backup of what is on this browser now. A recoverable copy is also kept on this browser automatically."));
  wrap.appendChild(h("div", { class: "row" },
    h("button", { type: "button", onclick: () => { downloadText(`ai-business-practice-before-import-${today()}.json`, JSON.stringify(buildBackup(store.data, content), null, 2), "application/json"); store.updateMeta({ lastExportAt: nowIso() }); } }, "Back up current work first"),
    h("button", { type: "button", class: "primary", onclick: () => {
      const res = applyImport(store.data, data, plan, decisions, content);
      if (!res.ok) return inlineMessage(msg, res.error);
      if (!store.replace(res.progress)) return inlineMessage(msg, "The import could not be saved on this browser. Your previous work is unchanged.");
      toast("Import complete.");
      done();
    } }, "Import"),
    h("button", { type: "button", onclick: done }, "Cancel")));
  wrap.appendChild(msg);
  return wrap;
}

function describeVersion(r) {
  if (!r) return "—";
  const t = r.updatedAt || r.submittedAt || r.createdAt;
  return t ? `updated ${formatTime(t)}` : "no date";
}

function previousSection(app) {
  const prev = app.store.previousCopy();
  const box = h("section", { class: "stack" }, h("h2", null, "Undo the last restore"));
  if (!prev) { box.appendChild(h("p", { class: "muted small" }, "No earlier copy is kept yet. One is kept automatically whenever an import, restore or reset replaces your work.")); return box; }
  box.appendChild(h("p", null, `The work as it was before the last replacement (saved ${formatTime(prev.savedAt)}) is kept on this browser.`));
  box.appendChild(h("button", { type: "button", onclick: () => {
    if (!confirm("Swap back to the earlier copy? Your current work becomes the kept copy, so you can swap again.")) return;
    if (app.store.replace(prev.progress)) { toast("Earlier copy restored."); app.rerender(); }
  } }, "Restore the earlier copy"));
  return box;
}

function themeSection() {
  let current = "system";
  try { current = localStorage.getItem(THEME_KEY) || "system"; } catch (e) { /* ignore */ }
  return h("section", { class: "stack" }, h("h2", null, "Appearance"),
    pills("theme", [["system", "Follow device"], ["light", "Light"], ["dark", "Dark"]], current, v => {
      if (v === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
      try { if (v === "system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, v); } catch (e) { /* ignore */ }
    }, "Theme"));
}

function aboutSection(app) {
  return h("section", { class: "stack" }, h("h2", null, "About this app and its limits"),
    h("ul", { class: "small stack" },
      h("li", null, "No account, analytics, cloud storage or AI service. After the first load, editing and saving a loaded lesson works without a network connection. Reloading the app offline is not supported."),
      h("li", null, "Local storage is not encryption or access control. Anyone using this browser profile can open the app and read your notes."),
      h("li", null, "Only answer-key selections are checked automatically. Written work is never graded by the app; rubric results are yours, and pasted AI reviews stay marked as unverified."),
      h("li", null, "Evidence states record activity — not grades, competence or readiness to sell."),
      h("li", null, `Content: ${app.content.lessons.size} interactive lessons and ${app.content.missionOrder.length - app.content.lessonByMission.size} outline missions. Planned briefs CP01–CP05 are notes, not lessons.`),
      h("li", null, "Framework: Dan Martell’s AI Company Operating System Playbook (Audit → Build → Test → Scale, RCCF, Camcorder Method, Buyback Loop). Cases, rubrics and exercises are original app material; this is not an official Dan Martell product. Optional readings from Jon Jones and Andrew Dunn are linked where relevant; their figures are their own claims.")),
    h("p", { class: "small" }, h("a", { href: "handoff/README.md", target: "_blank", rel: "noopener" }, "Design handoff and specification")));
}

function deleteSection(app) {
  return h("section", { class: "stack" }, h("h2", null, "Start over"),
    h("p", { class: "small muted" }, "Replaces all work on this browser with an empty profile. One recoverable copy is kept on this browser (see “Undo the last restore”). To remove everything, also clear this site’s data in your browser settings."),
    h("button", { type: "button", class: "danger", onclick: () => {
      if (!confirm("Replace all work on this browser with an empty profile? Export first if you want a file copy.")) return;
      if (app.store.replace(blankProgress())) { toast("Started over. The previous work is kept as a recoverable copy."); app.rerender(); }
    } }, "Start over with empty work"));
}
