"use client";

import { useState, useEffect } from "react";
import "../app/newsfeed.css";

/* ─ Types ─────────────────────────────────────────────────────────── */
interface NewsApiArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
}
interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

type Comment = { user: string; text: string };
interface Article {
  id: number;
  title: string;
  summary: string;
  source: string;
  comments: Comment[];
}

/* ─ Component ─────────────────────────────────────────────────────── */
export function NewsApp() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Fetch headlines once */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/news");
        const json: NewsApiResponse = await res.json();
        if (!res.ok) throw new Error(json.status);

        setArticles(
          json.articles.map(
            (a, idx): Article => ({
              id: idx + 1,
              title: a.title,
              summary: a.description ?? a.content ?? "",
              source: a.url,
              comments: [],
            })
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Add comment */
  const addComment = (id: number): void => {
    const text = drafts[id]?.trim();
    if (!text) return;

    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, comments: [...a.comments, { user: "You", text }] }
          : a
      )
    );
    setDrafts((d) => ({ ...d, [id]: "" }));
  };

  /* UI states */
  if (loading)
    return <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading…</p>;
  if (error)
    return (
      <p style={{ textAlign: "center", color: "red", marginTop: "2rem" }}>
        Error: {error}
      </p>
    );

  /* Render feed */
  return (
    <div className="feed-container">
      <h1
        style={{
          textAlign: "center",
          fontSize: "2.5rem",
          fontWeight: 800,
          margin: "2rem 0",
        }}
      >
        NewsFeed
      </h1>

      {articles.map((art) => (
        <article key={art.id} className="news-card">
          <h2>{art.title}</h2>
          <p className="news-summary">{art.summary}</p>

          {/* link & action buttons */}
          <div className="action-row">
            <a href={art.source} target="_blank" className="read-link">
              Read full article →
            </a>
            {["Summarize", "Podcast", "Share"].map((label) => (
              <button key={label} className="pill-btn">
                {label}
              </button>
            ))}
          </div>

          {/* comments */}
          <section>
            <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              Comments
            </h3>
            <div className="comment-list">
              {art.comments.map((c, i) => (
                <div key={i}>
                  <span>{c.user}:</span>
                  {c.text}
                </div>
              ))}
            </div>

            <div
              style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}
            >
              <input
                className="comment-input"
                type="text"
                placeholder="Add a comment…"
                value={drafts[art.id] ?? ""}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [art.id]: e.target.value }))
                }
              />
              <button className="post-btn" onClick={() => addComment(art.id)}>
                Post
              </button>
            </div>
          </section>
        </article>
      ))}
    </div>
  );
}
