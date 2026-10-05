import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { excerptFromMarkdown, markdownToHtml } from "./markdown-lite.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content", "articles");
const outDir = path.join(root, "articles");
const CSS_V = "3";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: raw.trim() };
  }

  const data = {};
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf(":");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    let value = trimmed.slice(sep + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === "true") value = true;
    if (value === "false") value = false;
    data[key] = value;
  }

  return { data, body: match[2].trim() };
}

function formatDateJa(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
}

function assetPaths(depth) {
  if (depth === 0) {
    return {
      portfolio: "../index.html",
      articles: "index.html",
      styles: "../styles.css",
      articlesCss: "articles.css",
    };
  }
  return {
    portfolio: "../../index.html",
    articles: "../index.html",
    styles: "../../styles.css",
    articlesCss: "../articles.css",
  };
}

function articleShell({
  title,
  description,
  bodyHtml,
  depth,
  backLabel,
  pageKind,
  articlesNavCurrent,
}) {
  const paths = assetPaths(depth);
  const metaTitle = escapeHtml(title);
  const metaDesc = escapeHtml(description || title);
  const bodyClass =
    pageKind === "index" ? "articles-page articles-page--index" : "articles-page articles-page--post";

  const articlesHref = paths.articles;
  const articlesCurrent =
    articlesNavCurrent === "articles" ? ` href="${articlesHref}" aria-current="page"` : ` href="${articlesHref}"`;

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${metaDesc}">
  <title>${metaTitle}｜鈴木孝輔</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Noto+Sans+JP:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${paths.styles}?v=12">
  <link rel="stylesheet" href="${paths.articlesCss}?v=${CSS_V}">
</head>
<body class="${bodyClass}">
  <a class="skip-link" href="#main">本文へ移動</a>
  <header class="site-header is-scrolled articles-header">
    <a class="brand" href="${paths.portfolio}" aria-label="ポートフォリオトップ">
      <span class="brand-serif">Kosuke</span>
      <span class="brand-serif brand-serif-sub">Suzuki</span>
    </a>
    <nav class="desktop-nav articles-nav" aria-label="記事ナビゲーション">
      <a href="${paths.portfolio}">PORTFOLIO</a>
      <a${articlesCurrent}>ARTICLES</a>
    </nav>
    <div class="articles-header-spacer" aria-hidden="true"></div>
  </header>
  <main id="main" class="articles-main">
${bodyHtml}
  </main>
  <footer class="site-footer articles-footer">
    <div class="footer-profile">
      <strong class="footer-name">KOSUKE SUZUKI</strong>
      <span>株式会社Japalent 代表取締役</span>
    </div>
    <div class="footer-links">
      <a href="${paths.portfolio}">${escapeHtml(backLabel)}</a>
      <a href="https://www.japalent.com/" target="_blank" rel="noopener">Japalent</a>
    </div>
    <p>© 2026 Kosuke Suzuki</p>
  </footer>
</body>
</html>`;
}

function loadArticles() {
  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const files = fs
    .readdirSync(contentDir)
    .filter(
      (name) =>
        name.endsWith(".md") &&
        !name.startsWith("_") &&
        name.toLowerCase() !== "readme.md"
    );

  const articles = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    if (data.draft === true) continue;

    const base = file.replace(/\.md$/i, "");
    const slug = String(data.slug || base).trim();
    const title = String(data.title || slug).trim();
    const date = String(data.date || "").trim();
    const description = String(data.description || "").trim();
    const tag = String(data.tag || "").trim();

    if (!slug || !title) {
      console.warn(`[skip] ${file}: title and slug are required when draft is false`);
      continue;
    }

    articles.push({
      slug,
      title,
      date,
      description,
      tag,
      body,
      excerpt: description || excerptFromMarkdown(body),
      sourceFile: file,
    });
  }

  articles.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return articles;
}

function writeFileEnsuringDir(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function cleanGeneratedSlugs(keepSlugs) {
  if (!fs.existsSync(outDir)) return;
  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!keepSlugs.has(entry.name)) {
      fs.rmSync(path.join(outDir, entry.name), { recursive: true, force: true });
    }
  }
}

const articles = loadArticles();
const keepSlugs = new Set(articles.map((a) => a.slug));
cleanGeneratedSlugs(keepSlugs);

for (const article of articles) {
  const htmlBody = markdownToHtml(article.body);
  const tagHtml = article.tag
    ? `<span class="article-single-tag">${escapeHtml(article.tag)}</span>`
    : "";

  const articleMain = `
    <article class="article-single">
      <header class="article-single-header">
        <div class="article-single-meta">
          ${tagHtml}
          ${article.date ? `<time datetime="${escapeHtml(article.date)}">${formatDateJa(article.date)}</time>` : ""}
        </div>
        <h1>${escapeHtml(article.title)}</h1>
      </header>
      <div class="article-prose">
        ${htmlBody}
      </div>
      <footer class="article-single-footer">
        <a class="article-back-link" href="../index.html">← 記事一覧へ</a>
      </footer>
    </article>`;

  const page = articleShell({
    title: article.title,
    description: article.description || article.excerpt,
    bodyHtml: articleMain,
    depth: 1,
    backLabel: "ポートフォリオへ",
    pageKind: "post",
    articlesNavCurrent: "articles",
  });

  writeFileEnsuringDir(path.join(outDir, article.slug, "index.html"), page);
}

const listItems =
  articles.length === 0
    ? `<div class="articles-empty">
        <p>記事は準備中です。海外リモートワークのノウハウや実践記を、順次公開していきます。</p>
        <a class="button button-outline" href="../index.html">ポートフォリオトップへ</a>
      </div>`
    : `<ol class="articles-list">
        ${articles
          .map(
            (a, index) => `<li class="articles-list-item${index === 0 ? " is-featured" : ""}">
          <a class="articles-list-link" href="./${escapeHtml(a.slug)}/">
            <div class="articles-list-top">
              ${a.date ? `<time datetime="${escapeHtml(a.date)}">${formatDateJa(a.date)}</time>` : ""}
              ${a.tag ? `<span class="articles-list-tag">${escapeHtml(a.tag)}</span>` : ""}
            </div>
            <h2 class="articles-list-title">${escapeHtml(a.title)}</h2>
            <p class="articles-list-excerpt">${escapeHtml(a.excerpt)}</p>
            <span class="articles-list-cta">続きを読む <span aria-hidden="true">→</span></span>
          </a>
        </li>`
          )
          .join("\n")}
      </ol>`;

const indexBody = `
    <div class="articles-index">
      <header class="articles-index-hero">
        <p class="eyebrow">ARTICLES</p>
        <h1>記事一覧</h1>
        <p class="articles-index-lead">海外リモートワークの始め方・案件獲得・キャリア。一覧から選んで、本文をそのまま読めます。</p>
        <p class="articles-index-count">${articles.length}件の記事</p>
      </header>
      ${listItems}
    </div>`;

const indexPage = articleShell({
  title: "記事一覧",
  description: "鈴木孝輔（こうすけ）の記事一覧。海外リモートワークとキャリアに関するノウハウ。",
  bodyHtml: indexBody,
  depth: 0,
  backLabel: "ポートフォリオへ",
  pageKind: "index",
  articlesNavCurrent: "articles",
});

writeFileEnsuringDir(path.join(outDir, "index.html"), indexPage);

const manifest = articles.map(({ slug, title, date, description, tag, excerpt }) => ({
  slug,
  title,
  date,
  description,
  tag,
  excerpt,
}));
writeFileEnsuringDir(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Built ${articles.length} article(s) → ${path.relative(root, outDir)}/`);
