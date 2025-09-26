import OpenAI from "openai";
import { type NextRequest } from "next/server";

import { responsesApiSchemas } from "@/lib/utils/responseSchemas";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("Missing API key");
    return new Response("Missing API key", { status: 500 });
  }

  console.log("format job request called");
  const client = new OpenAI({ apiKey });
  const data = await req.json();

  // Get the job schema from our responses API schemas
  const jobJsonSchema = responsesApiSchemas.job || responsesApiSchemas.job;

  if (!jobJsonSchema) {
    console.error("Job schema not found in responsesApiSchemas");
    return new Response("Job schema not available", { status: 500 });
  }

  try {
    console.log("=== JOB FORMAT DEBUG ===");
    console.log("Using job schema:", JSON.stringify(jobJsonSchema, null, 2));
    console.log(
      "Input messages count:",
      Array.isArray(data.messages) ? data.messages.length : "not array"
    );
    console.log("========================");

    // Choose model based on whether we're using vision
    const model = data.useVision ? "gpt-4o" : "gpt-4o-mini";

    const completion = await client.responses.create({
      model: model,
      input: data.messages,
      text: {
        format: {
          type: "json_schema",
          name: "job",
          strict: false, // Use false for complex schemas
          schema: jobJsonSchema,
        },
      },
      temperature: 0,
      store: false,
    });

    console.log("=== JOB RESPONSE DEBUG ===");
    console.log("Response received:", !!completion.output_text);
    console.log("Output text length:", completion.output_text?.length || 0);
    console.log("===========================");

    if (!completion.output_text) {
      console.error("No content in the completion response");
      return new Response("Invalid response from OpenAI", { status: 500 });
    }

    try {
      const parsedContent = JSON.parse(completion.output_text);
      console.log("Successfully parsed job data:", parsedContent);

      return new Response(JSON.stringify(parsedContent), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (parseError) {
      console.error("Failed to parse structured output:", parseError);
      console.error("Raw output that failed to parse:", completion.output_text);

      return new Response(completion.output_text, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    console.error("Error during OpenAI API call:", error);
    return new Response(
      JSON.stringify({
        error: "Error during API call",
        message: error.message || "Unknown error",
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
