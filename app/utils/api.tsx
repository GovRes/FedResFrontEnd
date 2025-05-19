import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { ChatCompletionUserMessageParam } from "openai/src/resources/index.js";

export async function sendMessages({
  messages,
  name,
}: {
  messages: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[];
  name: string;
}) {
  console.log("Sending messages to OpenAI API:", messages, name);
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, name }),
  });

  const text = await res.text();

  // Debug log the raw response
  console.log("Raw API response:", {
    status: res.status,
    statusText: res.statusText,
    text: text,
  });

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
    // Log the parsed data structure
    console.log("Parsed response data:", data);
    return data;
  } catch (error) {
    console.error("JSON parse error:", error);
    throw new Error(
      `Failed to parse response as JSON: ${text.substring(0, 100)}...`
    );
  }
}
