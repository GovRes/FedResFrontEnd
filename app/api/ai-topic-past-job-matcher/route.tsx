// Keep the same file structure, just replace the content
import type { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 25;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("=== API ROUTE WITH AMPLIFY FUNCTION LOGIC ===");

  // Instead of creating a separate function, just use the optimized logic here
  const startTime = Date.now();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Missing API key", { status: 500 });
  }

  const client = new OpenAI({ apiKey });
  const data = await req.json();

  try {
    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${data.input}

Return valid JSON: {"pastJobs": [job_objects_with_qualifications]}`,
          },
        ],
        max_tokens: 1000,
        temperature: data.temperature || 0,
      },
      {
        timeout: 15000, // 15 seconds
      }
    );

    const content = completion.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (parseError) {
      return new Response(JSON.stringify({ pastJobs: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: "Request failed",
        pastJobs: [],
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
