// Ultra-simple route.tsx - Compatible with existing ExperiencePage.tsx expectations
import OpenAI from "openai";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 25;
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
            content: `${data.input}

IMPORTANT: You MUST return a valid JSON response in this exact format:
{"pastJobs": [array_of_job_objects_with_qualifications]}

The pastJobs array should contain job objects that match the topic, with their qualifications arrays populated.
Keep response under 2000 characters to ensure fast processing.`,
          },
        ],
        max_tokens: 2000,
        temperature: data.temperature || 0,
      },
      {
        timeout: 20000, // 20 seconds max
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
    } catch (parseError: unknown) {
      console.log(
        "JSON parse failed, trying to extract...",
        parseError instanceof Error ? parseError.message : String(parseError)
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
        } catch (extractError: unknown) {
          console.log(
            "Extraction also failed:",
            extractError instanceof Error
              ? extractError.message
              : String(extractError)
          );
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
