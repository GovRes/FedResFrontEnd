import { usaJobObjectExtractorPrompt } from "@/lib/prompts/usaJobObjectExtractorPrompt";
import { USAJobsPositionTextFetch } from "@/lib/utils/responseSchemas";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const usaJobObjectExtractor = async ({
  jobObject,
}: {
  jobObject: USAJobsPositionTextFetch;
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `USA Jobs API response: ${JSON.stringify(jobObject, null, 2)}`,
  };

  console.log(20, "Job object to extract:", jobObject);

  const messagesForJobObjectExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, usaJobObjectExtractorPrompt];

  let res = await fetch("/api/ai-format-usa-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messagesForJobObjectExtractor }),
  });

  const text = await res.text();
  console.log(29, text);

  if (!res.ok) {
    try {
      const errorJson = JSON.parse(text);
      throw new Error(errorJson.error || "API error");
    } catch (e) {
      throw new Error(text || "Unknown API error");
    }
  }

  try {
    const data: Record<string, any> = JSON.parse(text);
    console.log(41, data);
    return data;
  } catch (error) {
    console.error("JSON parse error:", error);
    throw new Error(
      `Failed to parse response as JSON: ${text.substring(0, 100)}...`
    );
  }
};
