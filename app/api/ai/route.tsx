// Clean route.tsx - Responses API only with timeout fixes
import OpenAI from "openai";
import { type NextRequest } from "next/server";
import { responsesApiSchemas } from "@/lib/utils/responseSchemas";

// Add runtime configuration and timeout
export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("Missing API key");
    return new Response("Missing API key", { status: 500 });
  }

  const client = new OpenAI({ apiKey });
  const data = await req.json();

  const schemaName = data.name as keyof typeof responsesApiSchemas;
  const selectedJsonSchema = responsesApiSchemas[schemaName];

  if (!selectedJsonSchema) {
    console.error(`Invalid schema name: ${data.name}`);
    console.error(
      `Available schemas: ${Object.keys(responsesApiSchemas).join(", ")}`
    );
    return new Response(`Invalid schema name: ${data.name}`, { status: 400 });
  }

  if (!data.input) {
    return new Response("Missing input parameter", { status: 400 });
  }

  // Check for large inputs that might cause timeouts
  if (data.input.length > 100000) {
    // 100k characters
    console.warn(`Large input detected: ${data.input.length} characters`);
    return new Response(JSON.stringify({ error: "Input too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Debug logging
  console.log(`\n=== RESPONSES API DEBUG ===`);
  console.log(`Schema name: ${schemaName}`);
  console.log(`Input length: ${data.input.length}`);
  console.log(`Input preview: ${data.input.substring(0, 300)}...`);
  console.log(`Temperature: ${data.temperature ?? 0}`);
  console.log(`Use vision: ${data.useVision ?? false}`);
  console.log(`===========================\n`);

  try {
    console.log("Starting OpenAI request...");
    const startTime = Date.now();

    // Create the OpenAI request
    const completionPromise = client.responses.create({
      model: data.useVision ? "gpt-4o" : "gpt-4o-mini",
      input: data.input,
      text: {
        format: {
          type: "json_schema",
          name: schemaName,
          strict: false,
          schema: selectedJsonSchema,
        },
      },
      temperature: data.temperature ?? 0,
      store: false,
    });

    // Race between the API call and timeout
    const completion = (await Promise.race([
      completionPromise,
      new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("OpenAI request timeout")), 50000) // 50 seconds
      ),
    ])) as any;

    console.log(`OpenAI request completed in ${Date.now() - startTime}ms`);

    console.log(`\n=== RESPONSE DEBUG ===`);
    console.log(`Response received: ${!!completion.output_text}`);
    console.log(`Output text length: ${completion.output_text?.length || 0}`);
    console.log(
      `Raw output (first 300 chars): ${completion.output_text?.substring(0, 300)}...`
    );
    console.log(`======================\n`);

    if (completion.output_text) {
      try {
        const parsedContent = JSON.parse(completion.output_text);
        console.log(
          `Successfully parsed JSON with keys:`,
          Object.keys(parsedContent)
        );

        // Return the parsed object as JSON - this is the key fix
        return new Response(JSON.stringify(parsedContent), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (parseError) {
        console.error("Failed to parse structured output:", parseError);
        console.error(
          "Raw output that failed to parse:",
          completion.output_text
        );

        // FIXED: Try to extract JSON from the raw output if it's malformed
        try {
          // Sometimes the AI returns JSON wrapped in markdown or with extra text
          const jsonMatch = completion.output_text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log(
              "Successfully extracted and parsed JSON from malformed response"
            );
            return new Response(JSON.stringify(extractedJson), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (extractError) {
          console.error(
            "Failed to extract JSON from malformed response:",
            extractError
          );
        }

        // FIXED: Return a proper error response instead of invalid JSON
        return new Response(
          JSON.stringify({
            error: "Invalid JSON response from AI",
            raw_output: completion.output_text.substring(0, 500), // Limit length for debugging
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.error("No content in the completion response");
      console.error("Full response object:", completion);
      return new Response(
        JSON.stringify({ error: "No content in AI response" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("\n=== ERROR DEBUG ===");
    console.error("Error type:", error.type);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    console.error("==================\n");

    // Handle timeout specifically
    if (error.message === "OpenAI request timeout") {
      return new Response(
        JSON.stringify({
          error: "Request timeout",
          message:
            "The AI request took too long to complete. Please try again.",
        }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error.type === "invalid_request_error") {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          message: error.message,
          code: error.code,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Error during API call",
        message: error.message || "Unknown error",
        details: error.toString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
