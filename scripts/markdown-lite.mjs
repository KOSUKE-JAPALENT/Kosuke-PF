/** Minimal Markdown → HTML (LinkedIn-style posts + common Markdown). */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
    const safeHref = escapeHtml(href.trim());
    return `<a href="${safeHref}" rel="noopener">${escapeHtml(label)}</a>`;
  });
  return out;
}

const HR_PATTERN = /^(-{3,}|ー{2,}|─{2,})$/;
const STEP_HEADING = /^[①②③④⑤⑥⑦⑧⑨⑩]\s*(.+)$/;
const BULLET = /^[・•]\s*(.+)$/;
const QUOTE_JA = /^「(.+)」$/;

export function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      html.push("</blockquote>");
      inBlockquote = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      closeBlockquote();
      continue;
    }

    if (HR_PATTERN.test(trimmed)) {
      closeLists();
      closeBlockquote();
      html.push('<hr class="article-divider">');
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeLists();
      closeBlockquote();
      const level = heading[1].length;
      const tag = level === 1 ? "h2" : level === 2 ? "h2" : "h3";
      html.push(`<${tag}>${inlineMarkdown(heading[2])}</${tag}>`);
      continue;
    }

    const step = trimmed.match(STEP_HEADING);
    if (step) {
      closeLists();
      closeBlockquote();
      html.push(`<h2 class="article-step">${inlineMarkdown(trimmed)}</h2>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      closeLists();
      const quote = trimmed.replace(/^>\s?/, "");
      if (!inBlockquote) {
        html.push("<blockquote>");
        inBlockquote = true;
      }
      html.push(`<p>${inlineMarkdown(quote)}</p>`);
      continue;
    }

    const bullet = trimmed.match(BULLET);
    if (bullet) {
      closeBlockquote();
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul class="article-list">');
        inUl = true;
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    const ul = trimmed.match(/^[-*]\s+(.+)$/);
    if (ul) {
      closeBlockquote();
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul class="article-list">');
        inUl = true;
      }
      html.push(`<li>${inlineMarkdown(ul[1])}</li>`);
      continue;
    }

    const ol = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      closeBlockquote();
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${inlineMarkdown(ol[1])}</li>`);
      continue;
    }

    const quoteJa = trimmed.match(QUOTE_JA);
    if (quoteJa) {
      closeLists();
      closeBlockquote();
      html.push(`<p class="article-quote-line">${inlineMarkdown(trimmed)}</p>`);
      continue;
    }

    closeLists();
    closeBlockquote();
    html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  closeLists();
  closeBlockquote();
  return html.join("\n");
}

/** Plain-text excerpt for listing cards (not full body). */
export function excerptFromMarkdown(markdown, maxLen = 160) {
  const body = markdown.replace(/^---[\s\S]*?---\r?\n?/, "");
  const plain = body
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[・•\-*]\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}
