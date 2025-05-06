import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const summary = searchParams.get("summary"); // already computed
  if (!summary)
    return NextResponse.json({ error: "summary missing" }, { status: 400 });

  // TTS as mp3 (≈15‑20 KB for 100 words)
  const speech = await openai.audio.speech.create({
    model: "tts-1",
    input: summary,
    voice: "alloy",
    format: "mp3",
  });

  const arrayBuffer = await speech.arrayBuffer();
  return new NextResponse(Buffer.from(arrayBuffer), {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
