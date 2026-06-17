import { Router } from "express";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const demoPostRouter = Router();
const postsFile = resolve(dirname(fileURLToPath(import.meta.url)), "../data/demo-posts.json");

const slugify = (value) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)+/g, "");

const today = () => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date());

const readPosts = async () => JSON.parse(await readFile(postsFile, "utf8"));
const savePosts = async (posts) => writeFile(postsFile, `${JSON.stringify(posts, null, 2)}\n`);

const normalizePost = (post) => ({
  id: post.id || Date.now(),
  title: post.title || "Untitled post",
  slug: slugify(post.slug || post.title || `post-${Date.now()}`),
  excerpt: post.excerpt || "A fresh insight from the Nextexa Lab team.",
  content: post.content || post.excerpt || "This post is ready for content.",
  category: post.category || "Insights",
  status: post.status || "Draft",
  updated: post.updated || today(),
  read: post.read || "4 min",
});

demoPostRouter.get("/posts", (req, res) => {
  readPosts()
    .then((posts) => {
      const publishedOnly = req.query.published === "true";
      res.json(publishedOnly ? posts.filter((post) => post.status === "Published") : posts);
    })
    .catch((error) => res.status(500).json({ message: error.message }));
});

demoPostRouter.post("/posts", async (req, res) => {
  const posts = await readPosts();
  const post = normalizePost({ ...req.body, id: Date.now() });
  posts.unshift(post);
  await savePosts(posts);
  res.status(201).json(post);
});

demoPostRouter.patch("/posts/:id", async (req, res) => {
  const posts = await readPosts();
  const id = Number(req.params.id);
  const index = posts.findIndex((post) => Number(post.id) === id);
  if (index === -1) return res.status(404).json({ message: "Post not found" });

  posts[index] = normalizePost({ ...posts[index], ...req.body, id: posts[index].id });
  await savePosts(posts);
  res.json(posts[index]);
});

demoPostRouter.delete("/posts/:id", async (req, res) => {
  const posts = await readPosts();
  const id = Number(req.params.id);
  const index = posts.findIndex((post) => Number(post.id) === id);
  if (index === -1) return res.status(404).json({ message: "Post not found" });

  posts.splice(index, 1);
  await savePosts(posts);
  res.json({ ok: true });
});

export default demoPostRouter;
