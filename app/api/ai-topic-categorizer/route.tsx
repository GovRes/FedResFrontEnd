// Updated route.tsx - Fixed to properly use prompts and return topics array
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
  console.log(`===========================\n`);

  try {
    console.log("Starting OpenAI request...");
    const startTime = Date.now();

    // Simplify the schema for better performance
    const simplifiedSchema = simplifySchema(selectedJsonSchema);

    console.log("Using structured outputs with simplified schema...");

    const completion = await client.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: data.input, // Use the full prompt as provided
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: schemaName,
            schema: simplifiedSchema,
            strict: false, // Allow some flexibility to prevent errors
          },
        },
        temperature: data.temperature ?? 0,
        max_tokens: 4000,
      },
      {
        timeout: 25000, // Keep within the 30s function limit
      }
    );

    console.log(`OpenAI request completed in ${Date.now() - startTime}ms`);

    const content = completion.choices?.[0]?.message?.content;

    if (content) {
      try {
        const parsedContent = JSON.parse(content);
        console.log(
          `Successfully parsed JSON with keys:`,
          Object.keys(parsedContent)
        );

        // Ensure we return the correct structure for topics
        if (schemaName === "topics" && parsedContent.topics) {
          return new Response(
            JSON.stringify({ topics: parsedContent.topics }),
            {
              status: 200,
              headers: {
                "Content-Type": "application/json",
                "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
                "X-Debug-Stage": "success",
              },
            }
          );
        }

        // For other schemas, return as-is
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
        console.error("Raw output that failed to parse:", content);

        // Try to extract JSON from the raw content if it's malformed
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log(
              "Successfully extracted and parsed JSON from malformed response"
            );

            // Handle topics case for extracted JSON too
            if (schemaName === "topics" && extractedJson.topics) {
              return new Response(
                JSON.stringify({ topics: extractedJson.topics }),
                {
                  status: 200,
                  headers: {
                    "Content-Type": "application/json",
                    "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
                    "X-Debug-Stage": "extracted-success",
                  },
                }
              );
            }

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
            raw_output: content.substring(0, 500),
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
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
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
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
            "X-Debug-Stage": "invalid-request",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Error during API call",
        message: error.message || "Unknown error",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Time": `${Date.now() - requestStartTime}ms`,
          "X-Debug-Stage": "general-error",
        },
      }
    );
  }
}
