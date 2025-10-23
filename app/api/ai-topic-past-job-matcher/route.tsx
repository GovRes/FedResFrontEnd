// Optimized for batch processing with increased timeouts
import OpenAI from "openai";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // Increased from 20 to 60 seconds for batch processing
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response("Missing API key", { status: 500 });

  const client = new OpenAI({ apiKey });
  const data = await req.json();

  console.log("Received input length:", data.input?.length || 0);

  try {
    // gpt-4o-mini has a 128k token context window, which is roughly 100k+ characters
    // We can safely send much larger inputs. Let's limit to 80k characters for batch processing.
    const inputText = data.input.substring(0, 80000);

    if (data.input.length > 80000) {
      console.warn(
        "Input was truncated from",
        data.input.length,
        "to 80000 characters"
      );
    }

    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `${inputText}

Return valid JSON: {"pastJobs": [job_objects_with_qualifications_for_all_topics]}`,
          },
        ],
        max_tokens: 4000, // Increased from 2000 to 4000 to handle batch responses
        temperature: 0.1,
      },
      { timeout: 50000 } // Increased from 15000 to 50000 (50 seconds)
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

    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes("timeout")) {
      console.error("Request timed out - consider further optimization");
    }

    return new Response(
      JSON.stringify({
        pastJobs: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
      }
    );
  }
}
