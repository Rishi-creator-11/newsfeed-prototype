// src/app/api/podcast/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: Request) {
  const summary = new URL(req.url).searchParams.get("summary");
  if (!summary) {
    return NextResponse.json(
      { error: "Missing summary parameter" },
      { status: 400 }
    );
  }

  // Generate MP3 via OpenAI Text-to-Speech
  const speech = await openai.audio.speech.create({
    model: "tts-1", // or "tts-1-hd"
    input: summary,
    voice: "alloy",
    response_format: "mp3", // ← correct property name
    speed: 1.0, // optional
  });

  const arrayBuffer = await speech.arrayBuffer();
  return new NextResponse(Buffer.from(arrayBuffer), {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
