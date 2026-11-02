// Shared view components. All text goes through h(), so it is rendered inertly.

import { h } from "./dom.js";
import { STATE_INFO } from "./evidence.js";
import { MODE_INFO } from "./content.js";
import { wordCount } from "./util.js";

export function stateChip(state) {
  if (!state) return h("span", { class: "chip outline" }, "Not opened");
  const cls = state === "seen" ? "chip" : state === "applied" ? "chip good" : "chip info";
  return h("span", { class: cls, title: STATE_INFO[state].evidence }, STATE_INFO[state].label);
}

export function modeChip(mode) {
  const info = MODE_INFO[mode] || { label: mode };
  return h("span", { class: mode === "external" ? "chip warn" : "chip outline" }, info.label);
}

export const PROVENANCE_CHIP = {
  authored_choice_key: ["chip good", "Answer-key check · selections only"],
  self_review: ["chip", "Self-review"],
  external_ai_unverified: ["chip warn", "External AI review · unverified"],
  human_review: ["chip info", "Review from a person"]
};

export function provenanceChip(p) {
  const [cls, label] = PROVENANCE_CHIP[p] || ["chip", p];
  return h("span", { class: cls }, label);
}

export const RESULT_LABEL = { met: "Met", needs_work: "Needs work", uncertain: "Uncertain" };
export const REVIEW_LABEL = { demonstrated: "Demonstrated", needs_revision: "Needs revision", not_assessable: "Not assessable" };

export function resultChip(result) {
  const cls = result === "met" ? "chip good" : result === "needs_work" ? "chip warn" : "chip";
  return h("span", { class: cls }, RESULT_LABEL[result] || result);
}

// A set of radio "pills". onChange receives the chosen value.
export function pills(name, options, value, onChange, legend) {
  const fs = h("fieldset", null, legend ? h("legend", null, legend) : null);
  const wrap = h("div", { class: "pills" });
  for (const [val, label] of options) {
    const input = h("input", { type: "radio", name, value: val, checked: value === val, onchange: () => onChange(val) });
    wrap.appendChild(h("label", { class: "pill" }, input, h("span", null, label)));
  }
  fs.appendChild(wrap);
  return fs;
}

let fieldSeq = 0;
// A labelled text field. Changes are passed on immediately so the store can autosave.
export function textField({ label, value, onInput, long = false, short = false, help, maxWords, placeholder, rows }) {
  const id = `f${++fieldSeq}`;
  const input = long
    ? h("textarea", { id, class: short ? "short" : "", rows: rows || undefined, placeholder })
    : h("input", { id, type: "text", placeholder, autocomplete: "off" });
  input.value = value || "";
  const counter = maxWords || (long && !short) ? h("span", { class: "field-help", "aria-live": "off" }) : null;
  const updateCount = () => {
    if (!counter) return;
    const n = wordCount(input.value);
    counter.textContent = maxWords ? `${n} / ${maxWords} words${n > maxWords ? " — over the limit" : ""}` : `${n} words`;
  };
  updateCount();
  input.addEventListener("input", () => { updateCount(); onInput(input.value); });
  return h("div", { class: "field" },
    h("label", { class: "field-label", for: id }, label),
    help ? h("span", { class: "field-help", id: `${id}-help` }, help) : null,
    input,
    counter);
}

export function toast(message) {
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const t = h("div", { class: "toast", role: "status" }, message);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

export function errorText(message) {
  return h("p", { class: "banner error", role: "alert" }, message);
}

// Replaces an element's contents with a short inline message (used under buttons).
export function inlineMessage(container, message, kind = "error") {
  container.textContent = "";
  if (!message) return;
  container.appendChild(h("p", { class: `banner ${kind}`, role: kind === "error" ? "alert" : "status" }, message));
}

export function sectionHead(num, title, done) {
  return h("div", { class: "section-head" }, h("span", { class: "step-num", "aria-hidden": "true" }, done ? "✓" : String(num)), h("h2", null, title));
}

export function externalLink(href, label) {
  return h("a", { href, target: "_blank", rel: "noopener noreferrer" }, label);
}
