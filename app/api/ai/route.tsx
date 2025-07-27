import OpenAI from "openai";
import { type NextRequest } from "next/server";
import { zodResponseFormat } from "openai/helpers/zod";
import { AssistantResponse } from "ai";

import {
  AwardsArraySchema,
  Keywords,
  EducationArraySchema,
  Qualification,
  SpecializedExperienceArraySchema,
  Topic,
  TopicsArraySchema,
  PastJobsArraySchema,
} from "@/app/utils/responseSchemas";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  const assistantId = process.env.OPEN_AI_ASSISTANT_ID;

  if (!apiKey) {
    console.error("Missing API key");
    return new Response("Missing API key", { status: 500 });
  }

  const client = new OpenAI({ apiKey });
  const data = await req.json();

  const schemas = {
    awards: AwardsArraySchema,
    education: EducationArraySchema,
    keywords: Keywords,
    qualification: Topic,
    qualifications: Qualification,
    specializedExperiences: SpecializedExperienceArraySchema,
    topics: TopicsArraySchema,
    pastJobs: PastJobsArraySchema,
  };

  type SchemaKey = keyof typeof schemas;
  const schemaName = data.name as SchemaKey;
  const selectedSchema = schemas[schemaName];
  if (!selectedSchema) {
    console.error(`Invalid schema name: ${data.name}`);
    return new Response(`Invalid schema name: ${data.name}`, { status: 400 });
  }

  try {
    // Choose model based on whether we're using vision
    const model = data.useVision ? "gpt-4o" : "gpt-4o-mini";

    const completion = await client.beta.chat.completions.parse({
      messages: data.messages,
      model: model,
      response_format: zodResponseFormat(selectedSchema, schemaName),
    });

    if (!completion) {
      console.error("No content in the completion response");
      return new Response("Invalid response from OpenAI", { status: 500 });
    }
    const message = completion.choices[0]?.message;
    if (message?.parsed) {
      return new Response(JSON.stringify(message.parsed), { status: 200 });
    } else {
      return new Response(JSON.stringify(message), { status: 200 });
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
