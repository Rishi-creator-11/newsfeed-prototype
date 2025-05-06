"use client";

import { useState, useEffect } from "react";
import "../app/newsfeed.css"; // your existing styles

/* ── Types ───────────────────────────────────────────────────────── */
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
  description: string; // raw NewsAPI description
  source: string;
  comments: Comment[];
}

/* ── Component ───────────────────────────────────────────────────── */
export function NewsApp() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // summary from your API
  const [summaries, setSummaries] = useState<Record<number, string>>({});
  const [summLoading, setSummLoading] = useState<Record<number, boolean>>({});

  // fetch headlines
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/news");
        const json: NewsApiResponse = await res.json();
        if (!res.ok) throw new Error(json.status);

        setArticles(
          json.articles.map((a, i) => ({
            id: i + 1,
            title: a.title,
            description:
              a.description ?? a.content ?? "No description available.",
            source: a.url,
            comments: [],
          }))
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // add a comment
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const addComment = (id: number) => {
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

  // ◇ call your serverless summarizer
  const handleSummarize = async (id: number, url: string) => {
    if (summaries[id] || summLoading[id]) return;
    setSummLoading((s) => ({ ...s, [id]: true }));

    try {
      const res = await fetch(`/api/summarize?url=${encodeURIComponent(url)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      setSummaries((s) => ({ ...s, [id]: json.summary }));
    } catch (e: unknown) {
      console.error("Summarize error:", e);
      setSummaries((s) => ({ ...s, [id]: "Could not fetch summary." }));
    } finally {
      setSummLoading((s) => ({ ...s, [id]: false }));
    }
  };

  // ◇ Podcast still uses Web Speech API on the fetched summary
  const handlePodcast = (id: number) => {
    const text =
      summaries[id] || articles.find((a) => a.id === id)?.description;
    if (!text) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
  };

  if (loading) return <p className="text-center mt-10">Loading…</p>;
  if (error)
    return <p className="text-center text-red-600 mt-10">Error: {error}</p>;

  return (
    <div className="feed-container">
      <h1 className="text-5xl font-extrabold text-center mb-10">NewsFeed</h1>

      {articles.map((art) => (
        <article key={art.id} className="news-card">
          <h2>{art.title}</h2>

          <p className="news-summary">{art.description}</p>

          {/* ◇ show server summary if present */}
          {summaries[art.id] && (
            <div className="ai-summary">
              <strong>Summary:</strong> {summaries[art.id]}
            </div>
          )}

          <div className="action-row">
            <a href={art.source} target="_blank" className="read-link">
              Read full article →
            </a>
            <button
              className="pill-btn"
              onClick={() => handleSummarize(art.id, art.source)}
              disabled={summLoading[art.id]}
            >
              {summLoading[art.id]
                ? "Summarizing…"
                : summaries[art.id]
                ? "Summarized ✅"
                : "Summarize"}
            </button>
            <button className="pill-btn" onClick={() => handlePodcast(art.id)}>
              Podcast 🎧
            </button>
            <button
              className="pill-btn"
              onClick={() =>
                navigator.share?.({ title: art.title, url: art.source })
              }
            >
              Share
            </button>
          </div>

          <section>
            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Comments</h3>
            <div className="comment-list">
              {art.comments.map((c, i) => (
                <div key={i}>
                  <span>{c.user}:</span> {c.text}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <input
                className="comment-input"
                placeholder="Add a comment…"
                value={drafts[art.id] || ""}
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
