export async function handleImages(request, env, path) {
  const match = path.match(/^\/images\/([^/]+)$/);
  if (!match || request.method !== "GET") return null;

  if (!env.BLOG_IMAGES) return new Response("Image storage is not configured", { status: 500 });

  const object = await env.BLOG_IMAGES.get(match[1]);
  if (!object) return new Response("Image not found", { status: 404 });

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "ETag": object.httpEtag,
    },
  });
}
