// Applies a saved light/dark choice before first paint. Loaded as a file because the
// page's Content Security Policy does not allow inline scripts.
try {
  const t = localStorage.getItem("ai-business-practice:theme");
  if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
} catch (e) { /* storage blocked: follow the system setting */ }
