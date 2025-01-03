import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { ChatCompletionUserMessageParam } from "openai/src/resources/index.js";

export async function sendMessages({ messages, responseFormat={ "type": "json" } }: { messages: (ChatCompletionUserMessageParam|ChatCompletionSystemMessageParam)[], responseFormat?: {"type": string}}) {
  console.log(messages)
  const res = await fetch("/api/ai", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, response_format: responseFormat }),
  })
  const data: Record<string, any> = await res.json();
  console.log(data)
  return data;
}