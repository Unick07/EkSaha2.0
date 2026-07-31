const SITE_NAME = "EkSaha";
const LEGAL_NAME = "EkSaha";
const DEFAULT_SOCIAL_IMAGE = "/social/home.png";
const PUBLIC_EMAIL = "hello@eksaha.com";
const PUBLIC_PHONE = "+61424960124";
const OPERATING_COUNTRIES = ["Nepal", "Australia"];
const SERVICE_AREA = "Worldwide";
const TEAM_MEMBERS = [
  { name: "Unick Silwal", role: "Co-founder and CEO" },
  { name: "Saroj (G) Rajbanshi", role: "Co-founder and COO" },
];

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function absoluteUrl(value, origin) {
  try {
    return new URL(value || DEFAULT_SOCIAL_IMAGE, `${origin}/`).href;
  } catch {
    return new URL(DEFAULT_SOCIAL_IMAGE, `${origin}/`).href;
  }
}

function articleStructuredData(post, seo, origin) {
  const organizationId = `${origin}/#organization`;
  const websiteId = `${origin}/#website`;
  const webpageId = `${seo.canonical}#webpage`;
  const breadcrumbId = `${seo.canonical}#breadcrumb`;
  return [
    {
      "@id": organizationId,
      "@type": "Organization",
      name: SITE_NAME,
      legalName: LEGAL_NAME,
      url: `${origin}/`,
      email: PUBLIC_EMAIL,
      telephone: PUBLIC_PHONE,
      location: OPERATING_COUNTRIES.map((name) => ({ "@type": "Country", name })),
      areaServed: SERVICE_AREA,
      founder: TEAM_MEMBERS.map((member) => ({
        "@type": "Person",
        name: member.name,
        jobTitle: member.role,
      })),
      logo: {
        "@type": "ImageObject",
        url: `${origin}/brand/eksaha-icon.svg`,
      },
    },
    {
      "@id": websiteId,
      "@type": "WebSite",
      name: SITE_NAME,
      url: `${origin}/`,
      publisher: { "@id": organizationId },
      inLanguage: "en",
    },
    {
      "@id": `${seo.canonical}#article`,
      "@type": "Article",
      headline: post.title,
      description: seo.description,
      image: [seo.image],
      datePublished: post.created_at || undefined,
      dateModified: post.updated_at || post.created_at || undefined,
      mainEntityOfPage: { "@id": webpageId },
      author: {
        "@type": "Organization",
        name: "EkSaha Team",
        url: `${origin}/about`,
      },
      publisher: { "@id": organizationId },
      inLanguage: "en",
    },
    {
      "@id": webpageId,
      "@type": "WebPage",
      url: seo.canonical,
      name: seo.title,
      description: seo.description,
      isPartOf: { "@id": websiteId },
      primaryImageOfPage: { "@type": "ImageObject", url: seo.image },
      breadcrumb: { "@id": breadcrumbId },
      inLanguage: "en",
    },
    {
      "@id": breadcrumbId,
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
        { "@type": "ListItem", position: 2, name: "Insights", item: `${origin}/insights` },
        { "@type": "ListItem", position: 3, name: post.title, item: seo.canonical },
      ],
    },
  ];
}

export function createArticleSeo(post, origin) {
  const canonical = new URL(`/insights/${post.slug}`, `${origin}/`).href;
  const title = `${post.title} | ${SITE_NAME}`;
  const description = post.excerpt || `Read ${post.title}, a practical guide from the EkSaha team.`;
  const seo = {
    canonical,
    description,
    image: absoluteUrl(post.image_url || post.image, origin),
    imageAlt: post.image_url || post.image ? post.title : `${post.title} — ${SITE_NAME}`,
    modifiedTime: post.updated_at || undefined,
    publishedTime: post.created_at || undefined,
    robots: "index, follow",
    siteName: SITE_NAME,
    title,
    type: "article",
  };
  return {
    ...seo,
    structuredData: articleStructuredData(post, seo, origin),
  };
}

function renderStructuredData(items = []) {
  return items.map((item) => {
    const json = JSON.stringify(item).replaceAll("<", "\\u003c");
    return `<script data-seo-jsonld="true" type="application/ld+json">${json}</script>`;
  });
}

export function renderSeoHead(seo) {
  const articleTags = seo.type === "article"
    ? [
        seo.publishedTime && `<meta data-seo="article:published_time" property="article:published_time" content="${escapeHtml(seo.publishedTime)}" />`,
        seo.modifiedTime && `<meta data-seo="article:modified_time" property="article:modified_time" content="${escapeHtml(seo.modifiedTime)}" />`,
      ].filter(Boolean)
    : [];

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
    '<meta data-seo="twitter:card" name="twitter:card" content="summary_large_image" />',
    `<meta data-seo="twitter:title" name="twitter:title" content="${escapeHtml(seo.title)}" />`,
    `<meta data-seo="twitter:description" name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    `<meta data-seo="twitter:image" name="twitter:image" content="${escapeHtml(seo.image)}" />`,
    `<meta data-seo="twitter:image:alt" name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}" />`,
    ...articleTags,
    ...renderStructuredData(seo.structuredData),
  ].join("\n    ");
}

function contentPreview(content) {
  return String(content || "")
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => {
      const heading = section.match(/^#{1,3}\s+(.+)$/s);
      if (heading) return `<h2>${escapeHtml(heading[1])}</h2>`;
      return `<p>${escapeHtml(section.replace(/^[-*]\s+/gm, "• "))}</p>`;
    })
    .join("");
}

export function renderArticleFallback(post) {
  const image = post.image_url || post.image;
  const imageMarkup = image
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" />`
    : "";
  return [
    '<main class="container-shell py-16" data-edge-rendered="article">',
    '<article class="mx-auto max-w-4xl">',
    `<p class="eyebrow">${escapeHtml(post.category || "Insights")}</p>`,
    `<h1 class="text-4xl font-extrabold">${escapeHtml(post.title)}</h1>`,
    `<p class="mt-5 text-lg text-muted">${escapeHtml(post.excerpt || "")}</p>`,
    imageMarkup,
    `<div class="mt-10">${contentPreview(post.content || post.excerpt)}</div>`,
    "</article>",
    "</main>",
  ].join("");
}

export function injectSeoAndFallback(document, seo, fallbackHtml) {
  const withSeo = document.replace(
    /<!--seo:start-->[\s\S]*?<!--seo:end-->/,
    `<!--seo:start-->\n    ${renderSeoHead(seo)}\n    <!--seo:end-->`,
  );
  if (!fallbackHtml) return withSeo;
  return withSeo.replace('<div id="root"></div>', `<div id="root">${fallbackHtml}</div>`);
}
