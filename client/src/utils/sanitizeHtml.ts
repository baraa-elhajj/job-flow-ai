const ALLOWED_TAGS = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "EM",
  "H2",
  "H3",
  "H4",
  "I",
  "LI",
  "OL",
  "P",
  "PRE",
  "STRONG",
  "U",
  "UL",
]);

const REMOVED_TAGS = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED"]);

export function sanitizeStructuredHtml(value: string): string {
  const document = new DOMParser().parseFromString(value, "text/html");
  const elements = [...document.body.querySelectorAll("*")];

  for (const element of elements) {
    if (REMOVED_TAGS.has(element.tagName)) {
      element.remove();
      continue;
    }

    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      continue;
    }

    const href = element.tagName === "A" ? element.getAttribute("href") : null;
    for (const attribute of [...element.attributes]) {
      element.removeAttribute(attribute.name);
    }

    if (href) {
      try {
        const url = new URL(href, window.location.origin);
        if (["http:", "https:", "mailto:"].includes(url.protocol)) {
          element.setAttribute("href", url.href);
          element.setAttribute("rel", "noopener noreferrer");
          element.setAttribute("target", "_blank");
        }
      } catch {
        // Leave invalid links without an href.
      }
    }
  }

  return document.body.innerHTML;
}
