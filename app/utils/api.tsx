import { ChatCompletionSystemMessageParam } from "openai/resources/index.mjs";
import { ChatCompletionUserMessageParam } from "openai/src/resources/index.js";

export async function sendMessages({ messages, name}: { messages: (ChatCompletionUserMessageParam|ChatCompletionSystemMessageParam)[], name: string }) {
  console.log(5)
  const res = await fetch("/api/ai", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, name }),
  })
  const data: Record<string, any> = await res.json();
  return data;
}