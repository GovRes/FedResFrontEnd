import OpenAI from "openai";
import { AssistantResponse } from "ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

async function createAssistant() {
  const assistant = await openai.beta.assistants.create({
    name: "HR Professional",
    instructions:
      "You are an expert in writing resumes for federal jobs. Your goal is to ask the user questions about their experience, until you have enough information to generate a paragraph about that experience. They will use this on their resume.",
    model: "gpt-4o-mini",
  });
  console.log(assistant);
  return assistant;
}
export async function POST(req: Request) {
  const { initialMessage, ...input } = await req.json();
  const assistant = await createAssistant();
  const assistantId = assistant.id;
  let threadId = input.threadId;

  if (!threadId) {
    threadId = (await openai.beta.threads.create({})).id;

    if (initialMessage) {
      await openai.beta.threads.messages.create(threadId, {
        role: "assistant",
        content: initialMessage,
      });
    }
  }

  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: input.message,
  });

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream }) => {
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          assistantId ??
          (() => {
            throw new Error("ASSISTANT_ID environment is not set");
          })(),
      });

      await forwardStream(runStream);
    }
  );
}
