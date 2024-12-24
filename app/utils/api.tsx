import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { ChatCompletionUserMessageParam } from "openai/src/resources/index.js";

export async function sendMessages({ messages, responseFormat={ "type": "json" } }: { messages: (ChatCompletionUserMessageParam|ChatCompletionSystemMessageParam)[], responseFormat?: {"type": string}}) {
  const res = await fetch("/api/ai", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, response_format: responseFormat }),
  })
  const data: Record<string, string> = await res.json();
  return data;
}