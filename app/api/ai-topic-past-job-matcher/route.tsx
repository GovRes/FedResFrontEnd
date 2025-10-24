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
    const inputText = data.input;

    console.log(`Processing ${inputText.length} characters with Claude`);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0.0,
      messages: [
        {
          role: "user",
          content: `${inputText}

CRITICAL FORMATTING REQUIREMENTS:
1. Return ONLY the NEW qualifications you are adding - DO NOT return existing qualifications
2. DO NOT return the complete past jobs array - only return new matches
3. Return valid JSON with no markdown, no explanations
4. All text fields must properly escape special characters:
   - Replace " with \\"
   - Replace \\ with \\\\
   - Replace newlines with \\n
   - Replace tabs with \\t

Return format:
{
  "newQualifications": [
    {
      "pastJobId": "uuid-of-the-job-this-qualification-belongs-to",
      "qualification": {
        "id": "",
        "topic": {COMPLETE_EXACT_COPY_OF_PROVIDED_TOPIC_OBJECT},
        "description": "",
        "title": "title based on topic",
        "paragraph": "",
        "userConfirmed": false,
        "question": "question connecting this qualification to the specific job"
      }
    }
  ]
}

IMPORTANT:
- Only include NEW qualifications where the topic UUID is NOT already in the job's existing qualifications
- Each object in the array must have both pastJobId and qualification fields
- The qualification object should follow the exact structure shown above
- If no new qualifications are found, return {"newQualifications": []}`,
        },
      ],
    });

    const content = message.content[0];

    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    let responseText = content.text.trim();

    console.log("=== CLAUDE RESPONSE ===");
    console.log("Length:", responseText.length, "characters");
    console.log("Starts with:", responseText.substring(0, 100));
    console.log(
      "Ends with:",
      responseText.substring(Math.max(0, responseText.length - 100))
    );
    console.log("=======================");

    // More aggressive cleaning
    let parsed;
    let parseSuccess = false;

    // Step 1: Try direct parse
    try {
      parsed = JSON.parse(responseText);
      console.log("✅ Direct parse succeeded");
      parseSuccess = true;
    } catch (e) {
      console.log("⚠️ Direct parse failed, trying cleanup...");
    }

    // Step 2: Remove markdown
    if (!parseSuccess) {
      try {
        responseText = responseText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        parsed = JSON.parse(responseText);
        console.log("✅ Markdown removal succeeded");
        parseSuccess = true;
      } catch (e) {
        console.log("⚠️ Markdown removal didn't help");
      }
    }

    // Step 3: Extract JSON object
    if (!parseSuccess) {
      try {
        const match = responseText.match(/(\{[\s\S]*\})/);
        if (match) {
          parsed = JSON.parse(match[1]);
          console.log("✅ JSON extraction succeeded");
          parseSuccess = true;
        }
      } catch (e) {
        console.log("⚠️ JSON extraction failed");
      }
    }

    // Step 4: Try fixing common issues
    if (!parseSuccess) {
      try {
        // Fix common issues: trailing commas, unescaped quotes in specific patterns
        let fixed = responseText
          .replace(/,\s*}/g, "}") // Remove trailing commas before }
          .replace(/,\s*]/g, "]") // Remove trailing commas before ]
          .replace(/"\s*\n\s*"/g, '", "'); // Fix newlines between properties

        parsed = JSON.parse(fixed);
        console.log("✅ Fixed common JSON issues");
        parseSuccess = true;
      } catch (e) {
        console.log("⚠️ Common fixes didn't work");
      }
    }

    // Step 5: Log detailed error and give up
    if (!parseSuccess) {
      console.error("❌ All parsing attempts failed");
      console.error("Response length:", responseText.length);
      console.error("First 1000 chars:", responseText.substring(0, 1000));
      console.error(
        "Last 1000 chars:",
        responseText.substring(Math.max(0, responseText.length - 1000))
      );

      // Save the problematic response for debugging
      console.error("=== FULL RESPONSE FOR DEBUGGING ===");
      console.error(responseText);
      console.error("=== END FULL RESPONSE ===");

      parsed = { newQualifications: [] };
    }

    const qualCount = parsed.newQualifications?.length || 0;
    console.log("Final result:", qualCount, "new qualifications returned");

    if (qualCount > 0) {
      // Group by job for logging
      const byJob = parsed.newQualifications.reduce((acc: any, item: any) => {
        acc[item.pastJobId] = (acc[item.pastJobId] || 0) + 1;
        return acc;
      }, {});
      console.log("New qualifications by job:", byJob);
    }

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
        newQualifications: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
