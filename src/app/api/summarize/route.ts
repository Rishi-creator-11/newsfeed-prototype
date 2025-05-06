import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import fetch from "node-fetch";
import { Readability } from "@mozilla/readability";

/* ─── Inline English stopword list ─────────────────────────────────── */
const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "you",
  "this",
  "have",
  "but",
  "not",
  "are",
  "from",
  "they",
  "his",
  "her",
  "she",
  "which",
  "will",
  "one",
  "all",
  "their",
  "has",
  "more",
  "was",
  "can",
  "what",
  "when",
  "there",
  "were",
  "been",
  "its",
  "had",
  "out",
  "who",
  "may",
]);

/**
 * Summarize the given text by scoring and returning the top `maxSentences` sentences.
 */
function summarizeText(text: string, maxSentences = 5): string {
  // 1) Split into sentences
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  if (sentences.length <= maxSentences) return text;

  // 2) Build a word frequency map, excluding stopwords
  const freq: Record<string, number> = {};
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  for (const w of words) {
    if (!STOPWORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  // 3) Score each sentence by summing its word frequencies
  const scored = sentences.map((sent) => {
    const sentWords = sent.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const score = sentWords.reduce((sum, w) => sum + (freq[w] || 0), 0);
    return { sent: sent.trim(), score };
  });

  // 4) Pick the top N sentences, then restore original order
  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => sentences.indexOf(a.sent) - sentences.indexOf(b.sent))
    .map((o) => o.sent);

  return top.join(" ");
}

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 }
    );
  }

  // 1) Fetch the full article HTML
  const html = await (await fetch(url)).text();

  // 2) Extract the readable article text
  const doc = new JSDOM(html, { url }).window.document;
  const article = new Readability(doc).parse();
  const fullText = article?.textContent?.trim() || "";

  if (!fullText) {
    return NextResponse.json(
      { error: "Could not extract article text" },
      { status: 500 }
    );
  }

  // 3) Summarize locally using our TF-style scorer
  const summary = summarizeText(fullText, 5);

  return NextResponse.json({ summary });
}
