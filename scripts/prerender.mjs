import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, "..");
const clientDir = join(projectDir, "client");
const distDir = join(clientDir, "dist");
const serverEntry = pathToFileURL(join(clientDir, ".ssr", "entry-server.js")).href;
const { PRERENDER_ROUTES, PRIVATE_APP_SEO, render } = await import(serverEntry);

const template = await readFile(join(distDir, "index.html"), "utf8");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderStructuredData(items = []) {
  return items.map((item) => {
    const json = JSON.stringify(item).replaceAll("<", "\\u003c");
    return `<script data-seo-jsonld="true" type="application/ld+json">${json}</script>`;
  });
}

function renderSeoHead(seo) {
  const articleTags = seo.type === "article"
    ? [
        seo.publishedTime && `<meta data-seo="article:published_time" property="article:published_time" content="${escapeHtml(seo.publishedTime)}" />`,
        seo.modifiedTime && `<meta data-seo="article:modified_time" property="article:modified_time" content="${escapeHtml(seo.modifiedTime)}" />`,
      ].filter(Boolean).join("\n    ")
    : "";

  return [
    `<title data-seo="title">${escapeHtml(seo.title)}</title>`,
    `<meta data-seo="description" name="description" content="${escapeHtml(seo.description)}" />`,
    `<meta data-seo="robots" name="robots" content="${escapeHtml(seo.robots)}" />`,
    `<link data-seo="canonical" rel="canonical" href="${escapeHtml(seo.canonical)}" />`,
    `<meta data-seo="og:site_name" property="og:site_name" content="${escapeHtml(seo.siteName)}" />`,
    `<meta data-seo="og:type" property="og:type" content="${escapeHtml(seo.type)}" />`,
    `<meta data-seo="og:title" property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta data-seo="og:description" property="og:description" content="${escapeHtml(seo.description)}" />`,
    `<meta data-seo="og:url" property="og:url" content="${escapeHtml(seo.canonical)}" />`,
    `<meta data-seo="og:image" property="og:image" content="${escapeHtml(seo.image)}" />`,
    `<meta data-seo="og:image:alt" property="og:image:alt" content="${escapeHtml(seo.imageAlt)}" />`,
    `<meta data-seo="twitter:card" name="twitter:card" content="summary_large_image" />`,
    `<meta data-seo="twitter:title" name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta data-seo="twitter:description" name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    `<meta data-seo="twitter:image" name="twitter:image" content="${escapeHtml(seo.image)}" />`,
    `<meta data-seo="twitter:image:alt" name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}" />`,
    articleTags,
    ...renderStructuredData(seo.structuredData),
  ].filter(Boolean).join("\n    ");
}

function withSeo(document, seo) {
  return document.replace(
    /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
    `<!--seo:start-->\n    ${renderSeoHead(seo)}\n    <!--seo:end-->`,
  );
}

function renderDocument(appHtml, seo) {
  return withSeo(template, seo).replace(
    '<div id="root"></div>',
    `<div id="root" data-prerendered="true">${appHtml}</div>`,
  );
}

function outputFileForRoute(route) {
  if (route === "/") return join(distDir, "index.html");
  return join(distDir, `${route.slice(1)}.html`);
}

await writeFile(join(distDir, "__app.html"), withSeo(template, PRIVATE_APP_SEO), "utf8");

for (const route of PRERENDER_ROUTES) {
  const { appHtml, seo } = render(route);
  const outputFile = outputFileForRoute(route);
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, renderDocument(appHtml, seo), "utf8");
}

const notFound = render("/404");
await writeFile(join(distDir, "404.html"), renderDocument(notFound.appHtml, notFound.seo), "utf8");

await rm(join(clientDir, ".ssr"), { force: true, recursive: true });
console.log(`Prerendered ${PRERENDER_ROUTES.length} public routes and a custom 404 page.`);
