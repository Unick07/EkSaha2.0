import { useEffect, useState } from "react";
import { posts } from "../../data/insightPosts";
import { useAdminStore } from "../../store/useAdminStore";

// Raw ISO timestamps from the server ("2026-07-22T00:28:05.113Z") and the
// static posts' already-readable strings ("May 28, 2026") both parse fine
// here, so every post's date renders the same human way regardless of source.
export function formatPostDate(value) {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const normalizeStaticPost = (post) => ({ ...post, content: post.content || post.excerpt, image: post.image || null, source: "static" });
const normalizeAdminPost = (post) => ({
  slug: post.slug || String(post.id),
  category: post.category || "Insights",
  title: post.title,
  excerpt: post.excerpt || "A fresh insight from the EkSaha team.",
  content: post.content || post.excerpt || "",
  date: post.createdAt || post.updatedAt || post.updated || "Recently",
  read: post.read || "4 min",
  image: post.image || null,
  createdAt: post.createdAt || undefined,
  updatedAt: post.updatedAt || post.updated || undefined,
  source: "admin",
});

export function usePublishedPostsState() {
  const [serverPosts, setServerPosts] = useState([]);
  const [loading, setLoading] = useState(typeof window !== "undefined");
  const adminPosts = useAdminStore((state) => state.posts);
  useEffect(() => {
    let active = true;
    fetch("/api/demo/posts?published=true", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load public posts.");
        return response.json();
      })
      .then((records) => {
        if (active) setServerPosts(records);
      })
      .catch(() => {
        if (active) setServerPosts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const sourcePosts = serverPosts.length > 0 ? serverPosts : adminPosts;
  const publishedAdminPosts = sourcePosts
    .filter((post) => post.status === "Published")
    .map(normalizeAdminPost);

  return {
    loading,
    posts: [...publishedAdminPosts, ...posts.map(normalizeStaticPost)],
  };
}

export function usePublishedPosts() {
  return usePublishedPostsState().posts;
}
