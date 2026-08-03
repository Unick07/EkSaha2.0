import { LEGAL_NAME, OPERATING_COUNTRIES, PUBLIC_EMAIL, PUBLIC_PHONE, SERVICE_AREA, SITE_NAME, TEAM_MEMBERS } from "./siteConfig";

function organizationReference(origin) {
  return {
    "@id": `${origin}/#organization`,
    "@type": "Organization",
    name: SITE_NAME,
    legalName: LEGAL_NAME,
    url: `${origin}/`,
    email: PUBLIC_EMAIL,
    telephone: PUBLIC_PHONE,
    location: OPERATING_COUNTRIES.map((name) => ({
      "@type": "Country",
      name,
    })),
    areaServed: SERVICE_AREA,
    founder: TEAM_MEMBERS.map((member) => ({
      "@type": "Person",
      name: member.name,
      jobTitle: member.role,
    })),
    logo: {
      "@type": "ImageObject",
      url: `${origin}/icons/icon-512.png`,
      contentUrl: `${origin}/icons/icon-512.png`,
      width: 512,
      height: 512,
    },
  };
}

function website(origin) {
  return {
    "@id": `${origin}/#website`,
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${origin}/`,
    publisher: { "@id": `${origin}/#organization` },
    inLanguage: "en",
  };
}

function breadcrumb(items, origin) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, `${origin}/`).href,
    })),
  };
}

function pageSchema(pathname, seo, origin) {
  const common = {
    "@id": `${seo.canonical}#webpage`,
    "@type": "WebPage",
    url: seo.canonical,
    name: seo.title,
    description: seo.description,
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#organization` },
    inLanguage: "en",
  };

  if (pathname === "/") return { ...common, "@type": "WebPage" };
  if (pathname === "/about") return { ...common, "@type": "AboutPage" };
  if (pathname === "/contact") return { ...common, "@type": "ContactPage" };
  if (pathname === "/insights") return { ...common, "@type": "CollectionPage" };
  return common;
}

const serviceNames = {
  "/services/seo": "SEO Services",
  "/services/web": "Web Design and Development Services",
  "/services/ads": "Digital Advertising Management",
  "/services/it-support": "Managed IT Support",
};

export function createStaticStructuredData(pathname, seo) {
  const origin = new URL(seo.canonical).origin;
  const schemas = [organizationReference(origin), website(origin), pageSchema(pathname, seo, origin)];

  if (pathname !== "/") {
    const label = serviceNames[pathname]
      || {
        "/pricing": "Pricing",
        "/about": "About",
        "/insights": "Insights",
        "/contact": "Contact",
        "/privacy": "Privacy Policy",
        "/terms": "Terms of Service",
      }[pathname]
      || pathname.slice(1).replaceAll("-", " ");
    schemas.push(breadcrumb([
      { name: "Home", path: "/" },
      { name: label, path: pathname },
    ], origin));
  }

  if (serviceNames[pathname]) {
    schemas.push({
      "@type": "Service",
      name: serviceNames[pathname],
      description: seo.description,
      url: seo.canonical,
      provider: { "@id": `${origin}/#organization` },
      areaServed: SERVICE_AREA,
    });
  }

  return schemas;
}

export function createArticleStructuredData(post, seo) {
  const origin = new URL(seo.canonical).origin;
  return [
    organizationReference(origin),
    website(origin),
    {
      "@id": `${seo.canonical}#article`,
      "@type": "Article",
      headline: post.title,
      description: seo.description,
      image: [seo.image],
      datePublished: seo.publishedTime,
      dateModified: seo.modifiedTime || seo.publishedTime,
      mainEntityOfPage: { "@id": `${seo.canonical}#webpage` },
      author: {
        "@type": "Organization",
        name: "EkSaha Team",
        url: `${origin}/about`,
      },
      publisher: { "@id": `${origin}/#organization` },
      inLanguage: "en",
    },
    {
      "@id": `${seo.canonical}#webpage`,
      "@type": "WebPage",
      url: seo.canonical,
      name: seo.title,
      description: seo.description,
      isPartOf: { "@id": `${origin}/#website` },
      primaryImageOfPage: { "@type": "ImageObject", url: seo.image },
      breadcrumb: { "@id": `${seo.canonical}#breadcrumb` },
      inLanguage: "en",
    },
    {
      "@id": `${seo.canonical}#breadcrumb`,
      ...breadcrumb([
        { name: "Home", path: "/" },
        { name: "Insights", path: "/insights" },
        { name: post.title, path: `/insights/${post.slug}` },
      ], origin),
    },
  ];
}
