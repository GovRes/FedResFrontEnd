// Absolute minimal API route
import OpenAI from "openai";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 15; // Very short
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response("Missing API key", { status: 500 });

  const client = new OpenAI({ apiKey });
  const data = await req.json();

  try {
    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: 'Return JSON: {"pastJobs": []}' }], // Hardcoded minimal response
        max_tokens: 50,
      },
      { timeout: 8000 }
    );

    return new Response(JSON.stringify({ pastJobs: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ pastJobs: [] }), { status: 200 });
  }
}
