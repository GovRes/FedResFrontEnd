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
  console.log("sendMessages called with:", { messages, name });
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, name }),
  });
  const text = await res.text();
  console.log("Response text:", text);
  const data: Record<string, any> = JSON.parse(text);
  console.log("Parsed data:", data);
  return data;
}
