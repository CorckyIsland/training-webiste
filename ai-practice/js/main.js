// Boot, routing and the parts of the page outside the current view.

import { loadContent } from "./content.js";
import { createStore } from "./store.js";
import { h, clear } from "./dom.js";
import { formatTime } from "./util.js";
import { renderToday } from "./views/today.js";
import { renderCourse, renderMission } from "./views/course.js";
import { renderLesson } from "./views/lesson.js";
import { renderWork, renderAttemptDetail } from "./views/work.js";
import { renderSettings } from "./views/settings.js";

const main = document.getElementById("main");
const banners = document.getElementById("banners");
const indicator = document.getElementById("save-indicator");

function safeStorage() {
  try { return window.localStorage; } catch (e) {
    return { getItem() { throw e; }, setItem() { throw e; }, removeItem() { throw e; } };
  }
}

const app = {
  content: null,
  store: createStore({ storage: safeStorage() }),
  route: { name: "today", params: [] },
  rerender(opts = {}) { render(opts); },
  go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
};

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

function parseRoute() {
  const parts = (location.hash.replace(/^#\/?/, "") || "today").split("/").filter(Boolean).map(decodeURIComponent);
  return { name: parts[0], params: parts.slice(1) };
}

function setTabs(name) {
  const tab = { today: "today", course: "course", mission: "course", lesson: "course", work: "work", settings: "settings" }[name] || "";
  document.querySelectorAll(".tabs a").forEach(a => {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

function render({ keepScroll = false, focus } = {}) {
  app.route = parseRoute();
  const { name, params } = app.route;
  setTabs(name);
  const y = window.scrollY;
  clear(main);
  let view;
  try {
    switch (name) {
      case "today": view = renderToday(app); break;
      case "course": view = renderCourse(app); break;
      case "mission": view = renderMission(app, params[0]); break;
      case "lesson": view = renderLesson(app, params[0]); break;
      case "work": view = params[0] === "attempt" ? renderAttemptDetail(app, params[1]) : renderWork(app); break;
      case "settings": view = renderSettings(app); break;
      default: view = h("div", { class: "stack" }, h("h1", null, "Page not found"), h("p", null, h("a", { href: "#/today" }, "Go to Today")));
    }
  } catch (e) {
    console.error(e);
    view = h("div", { class: "stack" }, h("h1", null, "Something went wrong"), h("p", null, "This view could not be shown. Your saved work is not affected."), h("pre", { class: "pre-text small" }, String(e && e.message)));
  }
  main.appendChild(view);
  document.title = `${(view.dataset && view.dataset.title) || "AI Business Practice"} · AI Business Practice`;
  if (keepScroll) window.scrollTo(0, y);
  else window.scrollTo(0, 0);
  if (focus) {
    const el = main.querySelector(focus);
    if (el) { el.scrollIntoView({ block: "start" }); if (el.focus) el.focus({ preventScroll: true }); }
  }
  renderBanners();
}

function renderIndicator() {
  const s = app.store.status;
  indicator.dataset.kind = s.kind;
  const text = {
    idle: "Not saved yet",
    saving: "Saving…",
    saved: "Saved on this browser",
    error: "Not saved",
    conflict: "Not saved — newer copy elsewhere"
  }[s.kind] || "";
  indicator.textContent = text;
  indicator.title = s.kind === "saved" && s.lastSavedAt ? `Last saved ${formatTime(s.lastSavedAt)}` : s.message;
}

function renderBanners() {
  clear(banners);
  const s = app.store.status;
  if (s.kind === "error") {
    banners.appendChild(h("div", { class: "banner error", role: "alert" },
      h("p", null, h("strong", null, "Your latest change is not saved. "), s.message),
      h("div", { class: "row" },
        h("a", { class: "btn primary", href: "#/settings/export" }, "Export or copy my work"),
        h("button", { type: "button", onclick: () => { app.store.saveNow(); renderBanners(); } }, "Try saving again"))));
  } else if (s.kind === "conflict") {
    banners.appendChild(h("div", { class: "banner error", role: "alert" },
      h("p", null, s.message),
      h("div", { class: "row" },
        h("button", { type: "button", class: "primary", onclick: () => { app.store.reloadFromStorage(); render(); } }, "Reload the newer copy"),
        h("button", { type: "button", onclick: () => {
          if (confirm("Overwrite the copy saved from the other tab with this tab’s version?")) { app.store.saveNow({ force: true }); renderBanners(); }
        } }, "Keep this tab’s version"),
        h("a", { class: "btn", href: "#/settings/export" }, "Export this tab first"))));
  }
  if (app.content && app.content.problems.length && app.route.name === "course") {
    banners.appendChild(h("div", { class: "banner warn" },
      h("p", null, h("strong", null, "Content check: "), `${app.content.problems.length} problem(s) found while loading lessons.`),
      h("ul", { class: "small" }, app.content.problems.map(p => h("li", null, p)))));
  }
}

async function boot() {
  app.store.subscribe(() => { renderIndicator(); if (["error", "conflict"].includes(app.store.status.kind) || banners.firstChild) renderBanners(); });
  app.store.load();
  renderIndicator();
  try {
    app.content = await loadContent(fetchJson);
  } catch (e) {
    clear(main).appendChild(h("div", { class: "stack" },
      h("h1", null, "Lessons could not be loaded"),
      h("p", null, "The first load needs a connection to fetch the lesson files. Your saved work on this browser is untouched."),
      h("p", { class: "muted small" }, String(e.message)),
      h("button", { type: "button", class: "primary", onclick: () => location.reload() }, "Try again")));
    return;
  }
  window.addEventListener("hashchange", () => { app.store.flush(); render(); });
  render();
}

// Keep the sticky header out of the way of the software keyboard on phones.
document.addEventListener("focusin", e => {
  if (e.target.matches("input[type=text], input[type=number], textarea")) document.body.classList.add("typing");
});
document.addEventListener("focusout", () => document.body.classList.remove("typing"));

// Save pending drafts when the page is hidden or closed.
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") app.store.flush(); });
window.addEventListener("pagehide", () => app.store.flush());

// Another tab saved: say so instead of silently diverging.
window.addEventListener("storage", e => {
  if (e.key && e.key === "ai-business-practice:progress:v1" && app.store.status.kind !== "conflict") {
    if (!app.store.dirty) { app.store.reloadFromStorage(); render({ keepScroll: true }); }
    else { app.store.status.kind = "conflict"; app.store.status.message = "This app was saved from another tab or window. Nothing was overwritten. Reload to use the newer copy, or keep this tab’s version."; renderIndicator(); renderBanners(); }
  }
});

boot();
