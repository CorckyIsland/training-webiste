// Small pure helpers shared by the data layer and the views. No DOM access here.

export function nowIso() {
  return new Date().toISOString();
}

let counter = 0;
export function newId(prefix) {
  counter = (counter + 1) % 1e6;
  const rand = (globalThis.crypto && globalThis.crypto.randomUUID)
    ? globalThis.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}-${rand}`;
}

export function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

// JSON with sorted keys, so two records with the same content compare equal.
export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).filter(k => value[k] !== undefined).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
}

export function deepEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

export function wordCount(text) {
  const t = String(text || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

export function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function formatTime(iso) {
  if (!iso) return "never";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function isBlank(v) {
  if (v === undefined || v === null) return true;
  if (Array.isArray(v)) return v.length === 0;
  return String(v).trim() === "";
}
