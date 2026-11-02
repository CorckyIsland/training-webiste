// Local persistence in this browser profile. Every write is read back and compared
// before the app reports "Saved". A failed write keeps the last confirmed copy in
// storage and the unsaved change in memory, and the interface offers an export.
// A sequence number detects a newer save from another tab before overwriting it.

import { blankProgress } from "./model.js";
import { clone, nowIso, isPlainObject } from "./util.js";

export const STORAGE_KEY = "ai-business-practice:progress:v1";
export const PREVIOUS_KEY = "ai-business-practice:progress:v1:previous";
export const UNREADABLE_KEY_PREFIX = "ai-business-practice:progress:v1:unreadable:";

export function createStore({ storage, key = STORAGE_KEY, previousKey = PREVIOUS_KEY, debounceMs = 500, now = nowIso } = {}) {
  const listeners = new Set();
  let data = null;          // progress (schema shape + app extensions)
  let meta = {};            // app-local settings that are not part of a backup
  let seq = 0;              // sequence of the copy this tab last read or wrote
  let lastConfirmed = null; // the exact string last verified in storage
  let timer = null;
  let dirty = false;
  const status = { kind: "idle", message: "", lastSavedAt: null, unreadable: null };

  const notify = () => listeners.forEach(fn => fn(status));

  function readRaw() {
    try {
      return { ok: true, raw: storage.getItem(key) };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  function load() {
    const r = readRaw();
    if (!r.ok) {
      data = blankProgress(); meta = {}; seq = 0;
      setStatus("error", "This browser is blocking local storage, so nothing can be saved here. Export your work before closing the page.");
      return status;
    }
    if (r.raw === null) {
      data = blankProgress(); meta = {}; seq = 0;
      setStatus("idle", "Nothing saved on this browser yet.");
      return status;
    }
    try {
      const parsed = JSON.parse(r.raw);
      if (!isPlainObject(parsed) || !isPlainObject(parsed.progress) || parsed.progress.schemaVersion !== 1) throw new Error("unrecognised layout");
      data = parsed.progress;
      meta = isPlainObject(parsed.meta) ? parsed.meta : {};
      seq = Number(parsed.seq) || 0;
      lastConfirmed = r.raw;
      status.lastSavedAt = parsed.savedAt || null;
      setStatus("saved", "Saved on this browser.");
    } catch (e) {
      // Never overwrite something we cannot read. Saving stays off until the learner
      // decides; the unreadable text remains available to copy.
      data = blankProgress(); meta = {}; seq = 0;
      status.unreadable = r.raw;
      setStatus("error", "The saved data on this browser could not be read. It has not been changed. Saving is paused until you choose what to do in Backup & restore.");
    }
    return status;
  }

  function setStatus(kind, message) {
    status.kind = kind;
    status.message = message;
    notify();
  }

  function serialise(nextSeq) {
    return JSON.stringify({ app: "ai-business-practice", seq: nextSeq, savedAt: now(), meta, progress: data });
  }

  function storedSeq() {
    const r = readRaw();
    if (!r.ok || r.raw === null) return { ok: r.ok, seq: 0, raw: r.ok ? null : undefined };
    try { return { ok: true, seq: Number(JSON.parse(r.raw).seq) || 0, raw: r.raw }; } catch (e) { return { ok: true, seq: -1, raw: r.raw }; }
  }

  function saveNow({ force = false } = {}) {
    clearTimeout(timer); timer = null;
    if (status.unreadable !== null && !force) {
      setStatus("error", "Saving is paused because the existing saved data could not be read. Resolve it in Backup & restore.");
      return false;
    }
    const current = storedSeq();
    if (!force && current.ok && current.seq !== seq && current.raw !== lastConfirmed) {
      setStatus("conflict", "This app was saved from another tab or window after this one loaded. Nothing was overwritten. Reload to use the newer copy, or keep this tab’s version.");
      return false;
    }
    const nextSeq = Math.max(seq, current.seq > 0 ? current.seq : 0) + 1;
    const text = serialise(nextSeq);
    try {
      storage.setItem(key, text);
      const back = storage.getItem(key);
      if (back !== text) throw new Error("The saved copy did not match after writing.");
    } catch (e) {
      // Restore the last confirmed copy if the failed write left something partial.
      try {
        const back = storage.getItem(key);
        if (lastConfirmed !== null && back !== lastConfirmed && back !== text) storage.setItem(key, lastConfirmed);
      } catch (_) { /* storage unavailable */ }
      const quota = e && (e.name === "QuotaExceededError" || /quota/i.test(String(e.message)));
      setStatus("error", quota
        ? "Not saved: this browser’s storage for the app is full. Your last confirmed save is kept. Export your work now."
        : "Not saved: this browser refused the write. Your last confirmed save is kept. Export your work now so this change is not lost.");
      return false;
    }
    seq = nextSeq;
    lastConfirmed = text;
    dirty = false;
    status.unreadable = null;
    status.lastSavedAt = now();
    setStatus("saved", "Saved on this browser.");
    return true;
  }

  // Apply a change. Drafts are saved after a short pause; submissions and other
  // explicit actions save immediately so the learner sees the result at once.
  function update(mutator, { immediate = false } = {}) {
    const result = mutator(data, meta);
    dirty = true;
    if (status.kind !== "conflict") setStatus("saving", "Saving…");
    clearTimeout(timer);
    if (immediate) saveNow();
    else timer = setTimeout(saveNow, debounceMs);
    return result;
  }

  function updateMeta(patch) {
    meta = { ...meta, ...patch };
    dirty = true;
    return saveNow();
  }

  // Replace everything (restore/import). The previous confirmed copy is kept under a
  // separate key first, so the replacement can be undone.
  function replace(nextProgress, { keepPrevious = true } = {}) {
    if (keepPrevious && lastConfirmed !== null) {
      try { storage.setItem(previousKey, lastConfirmed); } catch (e) {
        setStatus("error", "Could not keep a recoverable copy of your current work, so nothing was replaced. Export a backup and try again.");
        return false;
      }
    }
    const before = data;
    data = clone(nextProgress);
    const ok = saveNow({ force: true });
    if (!ok) data = before;
    return ok;
  }

  function previousCopy() {
    try {
      const raw = storage.getItem(previousKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.progress ? { savedAt: parsed.savedAt, progress: parsed.progress } : null;
    } catch (e) { return null; }
  }

  function reloadFromStorage() {
    clearTimeout(timer); timer = null;
    status.unreadable = null;
    dirty = false;
    return load();
  }

  // Put unreadable data aside under its own key and start fresh.
  function setAsideUnreadable() {
    if (status.unreadable === null) return true;
    try {
      storage.setItem(UNREADABLE_KEY_PREFIX + Date.now(), status.unreadable);
    } catch (e) {
      setStatus("error", "Could not set the unreadable data aside. Copy it from Backup & restore first.");
      return false;
    }
    status.unreadable = null;
    return saveNow({ force: true });
  }

  function flush() { if (timer) saveNow(); }

  return {
    load, update, updateMeta, replace, saveNow, flush, reloadFromStorage, previousCopy, setAsideUnreadable,
    get data() { return data; },
    get meta() { return meta; },
    get dirty() { return dirty; },
    status,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    // For "copy my data" when saving fails.
    snapshotText() { return JSON.stringify(data, null, 2); }
  };
}
