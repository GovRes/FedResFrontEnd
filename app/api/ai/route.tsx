// Clean route.tsx - Responses API only
import OpenAI from "openai";
import { type NextRequest } from "next/server";
import { responsesApiSchemas } from "@/lib/utils/responseSchemas";

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

  // Debug logging
  console.log(`\n=== RESPONSES API DEBUG ===`);
  console.log(`Schema name: ${schemaName}`);
  console.log(`Input length: ${data.input.length}`);
  console.log(`Input preview: ${data.input.substring(0, 300)}...`);
  console.log(`Temperature: ${data.temperature ?? 0}`);
  console.log(`Use vision: ${data.useVision ?? false}`);
  console.log(`===========================\n`);

  try {
    const completion = await client.responses.create({
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
        return new Response(completion.output_text, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      console.error("No content in the completion response");
      console.error("Full response object:", completion);
      return new Response("Invalid response from OpenAI", { status: 500 });
    }
  } catch (error: any) {
    console.error("\n=== ERROR DEBUG ===");
    console.error("Error type:", error.type);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Full error:", error);
    console.error("==================\n");

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
