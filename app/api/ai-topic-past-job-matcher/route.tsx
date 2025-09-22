// Fixed parsing logic
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
    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${data.input.substring(0, 4000)}

Return valid JSON: {"pastJobs": [job_objects_with_qualifications]}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0,
      },
      { timeout: 15000 }
    );

    const content = completion.choices?.[0]?.message?.content || "";
    console.log("=== RAW RESPONSE ===");
    console.log(content);
    console.log("=== END RAW RESPONSE ===");

    // More robust JSON parsing
    let parsed;
    try {
      // First try direct parsing
      parsed = JSON.parse(content);
      console.log("Direct parse succeeded");
    } catch (parseError) {
      console.log("Direct parse failed, trying extraction...");

      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          console.log("Extraction parse succeeded");
        } catch (extractError) {
          console.log("Both parsing attempts failed");
          // Try to find just the pastJobs array
          const arrayMatch = content.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              const arrayData = JSON.parse(arrayMatch[0]);
              parsed = { pastJobs: arrayData };
              console.log("Array extraction succeeded");
            } catch (arrayError) {
              console.log("All parsing failed, returning empty");
              parsed = { pastJobs: [] };
            }
          } else {
            parsed = { pastJobs: [] };
          }
        }
      } else {
        parsed = { pastJobs: [] };
      }
    }

    console.log("Final parsed result:", JSON.stringify(parsed, null, 2));

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ pastJobs: [] }), { status: 200 });
  }
}
