// Dropped once into each private layout (AppShell for dashboard/admin/
// support/billing, AuthShell for the auth pages) rather than per-route -
// none of those pages have unique metadata worth setting, they just must
// never be indexed. React 19 hoists this into <head> on its own; see the
// comment in Seo.jsx for why no library is involved.
export default function Noindex() {
  return <meta name="robots" content="noindex, nofollow" />;
}
