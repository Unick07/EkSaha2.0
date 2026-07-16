import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/http/api";

export default function BlogReadOnly() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/posts")
      .then(({ data }) => {
        if (active) setPosts(data);
      })
      .catch((caught) => {
        const message = caught.response?.data?.message || "Could not load blog posts.";
        if (active) setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return <div>
    <div className="mb-7"><h2 className="text-2xl font-bold">Blog</h2><p className="mt-1 text-sm text-muted">View published and draft posts. Editing is managed by admins.</p></div>
    {loading && <div className="panel p-5 text-sm text-muted">Loading posts...</div>}
    {error && <div className="panel border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
    {!loading && !error && <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-surface-raised text-xs uppercase tracking-wider text-muted"><tr><th className="p-5">Title</th><th>Category</th><th>Status</th><th>Updated</th></tr></thead><tbody>{posts.map((post) => <tr className="border-t border-border" key={post.id}><td className="p-5"><div className="font-semibold">{post.title}</div><div className="mt-1 text-xs text-muted">{post.slug}</div></td><td>{post.category}</td><td><span className="rounded-full bg-surface-raised px-2.5 py-1 text-xs font-bold">{post.status || (post.published ? "Published" : "Draft")}</span></td><td className="text-muted">{post.updated || (post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : "")}</td></tr>)}</tbody></table>{posts.length === 0 && <div className="border-t border-border p-6 text-sm text-muted">No blog posts yet.</div>}</div></div>}
  </div>;
}
