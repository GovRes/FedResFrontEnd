// Ultra-simple route.tsx - Compatible with existing ExperiencePage.tsx expectations
import OpenAI from "openai";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 15; // Reduce to 15 seconds
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("=== ULTRA SIMPLE API START ===");
  const startTime = Date.now();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response("Missing API key", { status: 500 });
  }

  const client = new OpenAI({ apiKey });
  const data = await req.json();

  console.log(`Input length: ${data.input?.length || 0}`);
  console.log(`Schema name requested: ${data.name}`);

  try {
    console.log("Making basic chat completion...");

    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Quick analysis - does this job match the topic? 

Job: ${data.input.substring(0, 500)}

Reply with JSON: {"match": true/false, "pastJobs": []}`,
          },
        ],
        max_tokens: 200, // Tiny response
        temperature: 0,
      },
      {
        timeout: 8000, // 8 seconds max
      }
    );

    console.log(`Completed in ${Date.now() - startTime}ms`);

    const content = completion.choices?.[0]?.message?.content || "";
    console.log(`Response length: ${content.length}`);
    console.log(`Response preview: ${content.substring(0, 300)}...`);

    // Try to parse JSON, but don't fail if it's malformed
    try {
      const parsed = JSON.parse(content);
      console.log("Successfully parsed JSON, keys:", Object.keys(parsed));

      // Ensure we always return the expected format
      if (parsed.pastJobs) {
        console.log(`Returning ${parsed.pastJobs.length} past jobs`);
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else if (Array.isArray(parsed)) {
        // If AI returned array directly, wrap it
        console.log(`Wrapping direct array of ${parsed.length} items`);
        return new Response(JSON.stringify({ pastJobs: parsed }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        console.log("Parsed JSON but no pastJobs array found");
        return new Response(JSON.stringify({ pastJobs: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      const parseError = error as Error;
      console.log(
        "JSON parse failed, trying to extract...",
        parseError.message
      );
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          console.log("Successfully extracted JSON");

          if (extracted.pastJobs) {
            return new Response(JSON.stringify(extracted), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else if (Array.isArray(extracted)) {
            return new Response(JSON.stringify({ pastJobs: extracted }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (extractError) {
          const error = extractError as Error;
          console.log("Extraction also failed:", error.message);
        }
      }

      // If all parsing fails, return empty result in expected format
      console.log("Returning empty pastJobs array due to parse failure");
      return new Response(JSON.stringify({ pastJobs: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("API Error:", error.message);
    console.error("Error type:", error.type);
    console.error("Error code:", error.code);

    // Return error in expected format
    return new Response(
      JSON.stringify({
        error: "Request failed",
        message: error.message,
        pastJobs: [], // Always include pastJobs array
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
