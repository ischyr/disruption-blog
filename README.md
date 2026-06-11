# 0xd1s - Security Research Blog

A dark, terminal-styled blog built with **React + Vite**. Posts are plain
markdown files with full syntax highlighting.

## Run it

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Commit a new feature or blog post

```bash
git add -A
git commit -m "Add post: <title>"
git push
That's it. The push triggers the Deploy to GitHub Pages workflow → it runs npm run build on GitHub's server → publishes the new dist/ to your live site. It's typically live in 1–2 minutes. You don't build or touch dist/ yourself, and you don't re-do any of the Pages/DNS setup — that's all permanent now.
```

## Writing a post

Each post lives in **its own folder** under `src/posts/`, named after the post.
Put the markdown file (same name) and any images in that folder:

```text
src/posts/
  your-slug/
    your-slug.md
    cover.png
    diagram.png
```

The folder name is the slug — the URL becomes `/blog/your-slug`. Start the
markdown with frontmatter:

```markdown
---
title: My Write-up
date: 2026-06-11
image: cover.png
tags: [Web Pentesting, GraphQL]
excerpt: Optional teaser shown on the blog cards (auto-generated if omitted).
---

# Content goes here

Embed a folder image inline:

{% diagram %}
```

- **Cover photo** — the `image:` field takes the file name of an image in the
  post folder (or an absolute `/path`, or a full URL). Shown on the card and
  post header.
- **Inline images** — drop PNG/JPEG files in the folder and reference them with
  `{% name %}` (with or without extension). Tags inside code blocks are left
  literal. Missing images leave the tag visible so typos are obvious. Click any
  inline image to open it in a lightbox.
- **Callouts** — GitHub-style `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`,
  `[!WARNING]`, `[!CAUTION]`, plus a custom `[!EXPLOIT]` box.
- **Diagrams** — fenced ` ```mermaid ` blocks render as Mermaid diagrams
  (lazy-loaded, so they don't bloat the rest of the site).
- Fenced code blocks get syntax highlighting + a copy button; headings get
  hover "copy link" anchors. Posts sort newest-first by `date`; reading time is
  computed automatically.

## Other niceties

- **Search + tag filtering** on `/blog` (`?q=` and `?tag=` in the URL); tags on
  a post link straight to the filtered list; the post sidebar shows **related
  posts by shared tags**.
- **Reading-progress bar**, **back-to-top** button, and a styled terminal
  **404** page for unknown URLs.

## Customising

| What | Where |
| --- | --- |
| Name (`0xd1s`), role, tagline, socials, academy, about text | `src/config.js` |
| Tools page entries | `src/data/tools.js` |
| Certifications (About page) | `src/data/certs.js` |
| Certification badge images | `public/certs/` |
| Post images (cover + inline) | the post's own folder in `src/posts/` |
| Colors & theme | `:root` block in `src/index.css` |

## Pages

- `/` — Home (hero + stats + latest posts)
- `/about` — About / certifications / skills / academy
- `/blog` — All posts (with search + tag filter)
- `/blog/:slug` — A single post
- `/tools` — Published tooling
- `/videos` — YouTube videos (edit `src/data/videos.js`)
- `/quiz` — Interactive security quiz (edit `src/data/quiz.js`)
- `/glossary` — Searchable terms reference (edit `src/data/glossary.js`)
- `/graph` — Force-directed graph of posts linked by shared tags
