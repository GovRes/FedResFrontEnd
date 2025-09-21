// Clean route.tsx - Responses API only with timeout fixes
import OpenAI from "openai";
import { type NextRequest } from "next/server";
import { responsesApiSchemas } from "@/lib/utils/responseSchemas";

// Back to nodejs runtime with more aggressive optimizations
export const runtime = "nodejs";
export const maxDuration = 30; // Maximum for Amplify free hosting
export const dynamic = "force-dynamic";

// Function to simplify complex schemas for better performance
function simplifySchema(schema: any): any {
  if (typeof schema !== "object" || schema === null) {
    return schema;
  }

  const simplified = { ...schema };

  // Remove descriptions to reduce size
  delete simplified.description;
  delete simplified.examples;

  // Simplify array items with many nullable properties
  if (simplified.type === "array" && simplified.items) {
    simplified.items = simplifySchema(simplified.items);
  }

  // For objects with many nullable properties, make them required or remove nulls
  if (simplified.type === "object" && simplified.properties) {
    const newProperties: any = {};
    Object.keys(simplified.properties).forEach((key) => {
      const prop = simplified.properties[key];
      if (Array.isArray(prop.type) && prop.type.includes("null")) {
        // Remove null from type array, make it just the main type
        const mainType = prop.type.find((t: string) => t !== "null");
        newProperties[key] = {
          ...prop,
          type: mainType || "string",
        };
      } else {
        newProperties[key] = simplifySchema(prop);
      }
    });
    simplified.properties = newProperties;
  }

  return simplified;
}

export async function POST(req: NextRequest) {
  const requestStartTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("Missing API key");
    return new Response("Missing API key", {
      status: 500,
      headers: {
        "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
        "X-Debug-Stage": "api-key-missing",
      },
    });
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
  if (data.input.length > 50000) {
    // Reduced from 100k to 50k
    console.warn(`Large input detected: ${data.input.length} characters`);
    return new Response(
      JSON.stringify({
        error: "Input too large",
        inputLength: data.input.length,
        maxLength: 50000,
      }),
      {
        status: 413,
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
          "X-Debug-Stage": "input-too-large",
        },
      }
    );
  }

  // Debug logging
  console.log(`\n=== RESPONSES API DEBUG ===`);
  console.log(`Schema name: ${schemaName}`);
  console.log(`Input length: ${data.input.length}`);
  console.log(`Input preview: ${data.input.substring(0, 300)}...`);
  console.log(`Temperature: ${data.temperature ?? 0}`);
  console.log(`Use vision: ${data.useVision ?? false}`);
  console.log(
    `JSON Schema size: ${JSON.stringify(selectedJsonSchema).length} characters`
  );
  console.log(
    `JSON Schema preview: ${JSON.stringify(selectedJsonSchema).substring(0, 500)}...`
  );
  console.log(`===========================\n`);

  try {
    console.log("Starting OpenAI request...");
    const startTime = Date.now();

    // Use the simplest possible approach - chat completions with basic JSON
    console.log("Using simple chat completions for reliability...");

    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Return job matches as JSON array. Input (first 1500 chars): ${data.input.substring(0, 1500)}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 1000, // Limit response size
      },
      {
        timeout: 10000, // Very short timeout
      }
    );

    // Just make the request without Promise.race initially
    console.log("Making direct OpenAI request...");
    const completion = await completionPromise;

    console.log(`OpenAI request completed in ${Date.now() - startTime}ms`);

    console.log(`\n=== RESPONSE DEBUG ===`);
    console.log(
      `Response received: ${!!completion.choices?.[0]?.message?.content}`
    );
    const content = completion.choices?.[0]?.message?.content;
    console.log(`Content length: ${content?.length || 0}`);
    console.log(
      `Raw content (first 300 chars): ${content?.substring(0, 300)}...`
    );
    console.log(`======================\n`);

    if (content) {
      try {
        const parsedContent = JSON.parse(content);
        console.log(
          `Successfully parsed JSON with keys:`,
          Object.keys(parsedContent)
        );

        // Return the parsed object as JSON
        return new Response(JSON.stringify(parsedContent), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
            "X-Debug-Stage": "success",
          },
        });
      } catch (parseError) {
        console.error("Failed to parse structured output:", parseError);
        console.error(
          "Raw output that failed to parse:",
          completion.output_text
        );

        // Try to extract JSON from the raw content if it's malformed
        try {
          // Sometimes the AI returns JSON wrapped in markdown or with extra text
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log(
              "Successfully extracted and parsed JSON from malformed response"
            );
            return new Response(JSON.stringify(extractedJson), {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
                "X-Debug-Stage": "extracted-success",
              },
            });
          }
        } catch (extractError) {
          console.error(
            "Failed to extract JSON from malformed response:",
            extractError
          );
        }

        // Return a proper error response instead of invalid JSON
        return new Response(
          JSON.stringify({
            error: "Invalid JSON response from AI",
            raw_output: content.substring(0, 500), // Limit length for debugging
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
              "X-Debug-Stage": "parse-error",
            },
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
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
            "X-Debug-Stage": "no-content",
          },
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
        {
          status: 504,
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
            "X-Debug-Stage": "openai-timeout",
          },
        }
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
