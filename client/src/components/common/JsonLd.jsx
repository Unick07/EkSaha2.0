// Renders a schema.org JSON-LD block. Structured data doesn't need to live
// in <head> specifically - crawlers read it anywhere in the document - so
// this can just render an inline <script> in place, no hoisting required.
export default function JsonLd({ data }) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}
