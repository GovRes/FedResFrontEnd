import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY environment variable");
    return new Response("Missing API key", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const data = await req.json();

  console.log("Received input length:", data.input?.length || 0);

  try {
    // Claude Sonnet 4 has 200K token context window
    // Can easily handle 95KB+ input with no truncation
    const inputText = data.input;

    console.log(`Processing ${inputText.length} characters with Claude`);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: `${inputText}

Return ONLY valid JSON with no markdown formatting: {"pastJobs": [job_objects_with_qualifications]}`,
        },
      ],
    });

    const content = message.content[0];

    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const responseText = content.text;

    console.log("=== CLAUDE RESPONSE ===");
    console.log("Length:", responseText.length, "characters");
    console.log("Preview:", responseText.substring(0, 200));
    console.log("=======================");

    // Parse JSON response
    let parsed;
    try {
      // Try direct parse
      parsed = JSON.parse(responseText);
      console.log("✅ Direct parse succeeded");
    } catch (parseError) {
      console.log("⚠️ Direct parse failed, trying cleanup...");

      // Remove markdown code blocks if present
      let cleanContent = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      try {
        parsed = JSON.parse(cleanContent);
        console.log("✅ Parse succeeded after markdown removal");
      } catch (cleanError) {
        // Try to extract JSON from response
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
            console.log("✅ Extraction parse succeeded");
          } catch (extractError) {
            console.error("❌ All parsing attempts failed");
            parsed = { pastJobs: [] };
          }
        } else {
          console.error("❌ No JSON found in response");
          parsed = { pastJobs: [] };
        }
      }
    }

    console.log("Final result:", parsed.pastJobs?.length || 0, "jobs returned");

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Claude API Error:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return new Response(
      JSON.stringify({
        pastJobs: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
