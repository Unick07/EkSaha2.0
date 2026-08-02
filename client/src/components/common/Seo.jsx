export const SITE_NAME = "EkSaha";
export const SITE_URL = "https://eksaha.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/eksaha-og.png`;

// React 19 hoists <title>/<meta>/<link> rendered anywhere in the tree into
// <head> itself, deduping and cleaning up on unmount with no library needed
// (see https://react.dev/reference/react-dom/components/title). That's the
// whole reason this can be a plain component instead of react-helmet-async:
// the dependency detects React 19 and just falls back to this same native
// behavior internally, but its passthrough doesn't clean up old tags on
// route change - rendering the tags directly here does.
//
// Public marketing pages only - dashboard/admin/support/billing/auth use
// <Noindex/> instead, since they have nothing worth a title/description/
// canonical/OG set and must never be indexed.
export default function Seo({ title, description, path, image, type = "website" }) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content="index, follow" />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
