function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.dataset.seo = "managed";
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => {
    if (value) element.setAttribute(name, value);
    else element.removeAttribute(name);
  });
}

function upsertCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    element.dataset.seo = "managed";
    document.head.appendChild(element);
  }
  element.href = href;
}

function removeMeta(selector) {
  document.head.querySelector(selector)?.remove();
}

function applyStructuredData(items = []) {
  document.head.querySelectorAll('script[data-seo-jsonld="true"]').forEach((element) => element.remove());
  items.forEach((item) => {
    const element = document.createElement("script");
    element.type = "application/ld+json";
    element.dataset.seoJsonld = "true";
    element.textContent = JSON.stringify(item).replaceAll("<", "\\u003c");
    document.head.appendChild(element);
  });
}

export function applySeo(seo) {
  if (!seo) return;

  document.title = seo.title;
  upsertCanonical(seo.canonical);
  upsertMeta('meta[name="description"]', { name: "description", content: seo.description });
  upsertMeta('meta[name="robots"]', { name: "robots", content: seo.robots });
  upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: seo.siteName });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: seo.type });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: seo.title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: seo.description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: seo.canonical });
  upsertMeta('meta[property="og:image"]', { property: "og:image", content: seo.image });
  upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: seo.imageAlt });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: seo.title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: seo.description });
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: seo.image });
  upsertMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: seo.imageAlt });

  if (seo.type === "article" && seo.publishedTime) {
    upsertMeta('meta[property="article:published_time"]', { property: "article:published_time", content: seo.publishedTime });
  } else {
    removeMeta('meta[property="article:published_time"]');
  }
  if (seo.type === "article" && seo.modifiedTime) {
    upsertMeta('meta[property="article:modified_time"]', { property: "article:modified_time", content: seo.modifiedTime });
  } else {
    removeMeta('meta[property="article:modified_time"]');
  }
  applyStructuredData(seo.structuredData);
}
