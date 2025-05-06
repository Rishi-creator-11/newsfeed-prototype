import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.NEWSAPI_KEY;
  if (!key)
    return NextResponse.json({ error: "Missing NEWSAPI_KEY" }, { status: 500 });

  const res = await fetch(
    "https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=" + key
  );
  if (!res.ok)
    return NextResponse.json(
      { error: "NewsAPI failed" },
      { status: res.status }
    );

  const data = await res.json();
  return NextResponse.json(data);
}
