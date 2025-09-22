// Optimized API route with better input handling
import OpenAI from "openai";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20; // Increase slightly
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response("Missing API key", { status: 500 });

  const client = new OpenAI({ apiKey });
  const data = await req.json();

  console.log(`Full input length: ${data.input?.length || 0}`);

  try {
    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${data.input.substring(0, 4000)}

IMPORTANT: Return ONLY valid JSON in this format:
{"pastJobs": [{"id": "job_id", "title": "job_title", "qualifications": [{"title": "qual_name", "topicId": "topic_id", "topic": {topic_object}}]}]}

If no matches, return: {"pastJobs": []}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0,
      },
      { timeout: 15000 }
    );

    const content = completion.choices?.[0]?.message?.content || "";
    console.log("AI Response length:", content.length);
    console.log("AI Response preview:", content.substring(0, 500));

    try {
      const parsed = JSON.parse(content);
      console.log(
        "Successfully parsed, pastJobs count:",
        parsed.pastJobs?.length || 0
      );
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.log("Parse failed, trying extraction...");
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          console.log(
            "Successfully extracted, pastJobs count:",
            extracted.pastJobs?.length || 0
          );
          return new Response(JSON.stringify(extracted), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch {
          console.log("Extraction failed too");
        }
      }
      return new Response(JSON.stringify({ pastJobs: [] }), { status: 200 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ pastJobs: [] }), { status: 200 });
  }
}
