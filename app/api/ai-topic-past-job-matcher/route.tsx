// Direct and simple API route
import OpenAI from "openai";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response("Missing API key", { status: 500 });

  const client = new OpenAI({ apiKey });
  const data = await req.json();

  try {
    // Extract just the essential parts from the complex prompt
    const inputText = data.input || "";

    // Find the job data and topic data in the input
    const jobDataMatch = inputText.match(
      /Past jobs data to analyze:\s*(\[[\s\S]*?\])/
    );
    const topicMatch = inputText.match(
      /Job requirements topic with keywords:\s*(\{[\s\S]*?\})/
    );

    const jobData = jobDataMatch ? jobDataMatch[1] : "[]";
    const topicData = topicMatch ? topicMatch[1] : "{}";

    console.log("Extracted job data length:", jobData.length);
    console.log("Extracted topic data:", topicData);

    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Match this job experience to the topic:

JOB: ${jobData.substring(0, 2000)}

TOPIC: ${topicData}

If the job experience matches the topic keywords, return the job with qualifications added.
If no match, return empty array.

Return JSON: {"pastJobs": [job_objects_with_new_qualifications_if_matched]}`,
          },
        ],
        max_tokens: 800,
        temperature: 0,
      },
      { timeout: 15000 }
    );

    const content = completion.choices?.[0]?.message?.content || "";
    console.log("AI Response:", content);

    try {
      const parsed = JSON.parse(content);
      console.log("Parsed successfully, returning:", parsed);
      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.log("Parse failed, raw content:", content);
      return new Response(JSON.stringify({ pastJobs: [] }), { status: 200 });
    }
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ pastJobs: [] }), { status: 200 });
  }
}
