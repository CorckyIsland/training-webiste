// DOM helpers. Every piece of content, learner text and imported text is placed with
// textContent or text nodes. Nothing in this app assigns untrusted strings to innerHTML.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") el.className = value;
      else if (key === "text") el.textContent = value;
      else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
      else if (key === "value") el.value = value;
      else if (key === "checked") el.checked = !!value;
      else if (key === "dataset") Object.assign(el.dataset, value);
      else el.setAttribute(key, value === true ? "" : String(value));
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children) {
    if (child === undefined || child === null || child === false) continue;
    if (Array.isArray(child)) append(el, child);
    else if (child instanceof Node) el.appendChild(child);
    else el.appendChild(document.createTextNode(String(child)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

// Minimal Markdown for authored model answers: ### headings, paragraphs, numbered and
// bulleted lists, **bold** and `code`. Builds nodes; never interprets HTML.
export function renderMarkdown(text) {
  const root = document.createElement("div");
  root.className = "md";
  const lines = String(text || "").split(/\r?\n/);
  let list = null;
  let para = [];
  const flushPara = () => {
    if (para.length) { root.appendChild(h("p", null, inline(para.join(" ")))); para = []; }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); list = null; continue; }
    if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
      flushPara(); list = null;
      root.appendChild(h("h4", null, inline(m[1])));
    } else if ((m = line.match(/^\s*(\d+)\.\s+(.*)$/))) {
      flushPara();
      if (!list || list.tagName !== "OL") { list = h("ol"); root.appendChild(list); }
      list.appendChild(h("li", null, inline(m[2])));
    } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      flushPara();
      if (!list || list.tagName !== "UL") { list = h("ul"); root.appendChild(list); }
      list.appendChild(h("li", null, inline(m[1])));
    } else {
      list = null;
      para.push(line.trim());
    }
  }
  flushPara();
  return root;
}

function inline(text) {
  const frag = document.createDocumentFragment();
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const token = m[0];
    if (token.startsWith("**")) frag.appendChild(h("strong", null, token.slice(2, -2)));
    else frag.appendChild(h("code", null, token.slice(1, -1)));
    last = m.index + token.length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}

// Text with preserved line breaks (case text, learner submissions, pasted feedback).
export function pre(text, cls) {
  return h("div", { class: `pre-text ${cls || ""}`.trim() }, String(text ?? ""));
}

export function downloadText(filename, text, mime) {
  const blob = new Blob([text], { type: mime || "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copyText(text) {
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    return false;
  }
}
