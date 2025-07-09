// /api/assistant/route.tsx
import OpenAI from "openai";

// Create an OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Create a simple in-memory store for the paragraph
// In a production app, you would use a database
let paragraphStore = null as string | null;

// Shared assistant instance to avoid recreating it
let assistantInstance:
  | (OpenAI.Beta.Assistants.Assistant & { _request_id?: string | null })
  | null = null;

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();

    const { initialMessage, message, threadId: existingThreadId } = body;

    // Create or get the assistant
    if (!assistantInstance) {
      assistantInstance = await openai.beta.assistants.create({
        name: "Federal Resume Editor",
        instructions: `You helped the user write a paragraph. They have some requested changes. Edit the paragraph based on their changes. You can ask follow up questions if you need to. When you are ready to edit the paragraph, you MUST call the function "provideEditedParagraph" and pass an edited version of the original paragraph, using only details provided by the user, as a parameter
        
        - If you fail to call "provideEditedParagraph", you have not completed the task.  
        - DO NOT say "I will call the function."  
        - DO NOT return the paragraph in the chat.  
        - After calling the function, you should say: "I've created your paragraph based on the information you provided. You'll see it in a moment.`,
        model: "gpt-4o-mini",
        tools: [
          {
            type: "function",
            function: {
              name: "provideEditedParagraph",
              parameters: {
                type: "object",
                properties: {
                  paragraph: {
                    type: "string",
                    description:
                      "The paragraph edited according to the user's comments.",
                  },
                },
                required: ["paragraph"],
                additionalProperties: false,
              },
            },
          },
        ],
      });
    }

    // Create or use an existing thread
    let threadId = existingThreadId;
    let isNewThread = false;

    if (!threadId) {
      const thread = await openai.beta.threads.create({});
      threadId = thread.id;
      isNewThread = true;

      // Add initial assistant message for new threads
      await openai.beta.threads.messages.create(threadId, {
        role: "assistant",
        content: initialMessage,
      });
    }

    // Add the user message to the thread if provided
    if (message) {
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
      });
    }

    // Create a run
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantInstance.id,
    });

    // Poll for the run to complete (with timeout)
    let runResult = await openai.beta.threads.runs.retrieve(threadId, run.id);

    const startTime = Date.now();
    const TIMEOUT_MS = 30000; // 30 seconds timeout

    while (
      ["queued", "in_progress", "requires_action"].includes(runResult.status) &&
      Date.now() - startTime < TIMEOUT_MS
    ) {
      // Handle tool calls if needed
      if (
        runResult.status === "requires_action" &&
        runResult.required_action?.type === "submit_tool_outputs"
      ) {
        const toolCalls =
          runResult.required_action.submit_tool_outputs.tool_calls;

        const toolOutputs = [];
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === "provideEditedParagraph") {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const paragraphText = args.paragraph;

              paragraphStore = paragraphText; // Store the paragraph

              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({ success: true }),
              });
            } catch (error) {
              console.error("Error processing tool call:", error);
              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify({
                  error: "Failed to process paragraph",
                }),
              });
            }
          }
        }

        // Submit tool outputs
        if (toolOutputs.length > 0) {
          runResult = await openai.beta.threads.runs.submitToolOutputs(
            threadId,
            run.id,
            { tool_outputs: toolOutputs }
          );
          continue;
        }
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runResult = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Check if we timed out
    if (
      Date.now() - startTime >= TIMEOUT_MS &&
      !["completed", "failed"].includes(runResult.status)
    ) {
      return Response.json({
        threadId,
        timedOut: true,
        message:
          "The assistant is taking longer than expected. Please try again.",
      });
    }

    // Get the messages from the thread
    const messages = await openai.beta.threads.messages.list(threadId);

    // Get the latest assistant message
    const assistantMessages = messages.data.filter(
      (msg) => msg.role === "assistant"
    );

    let responseText = "";
    if (assistantMessages.length > 0) {
      const latest = assistantMessages[0]; // Messages are ordered by creation time (newest first)
      if (
        latest.content &&
        latest.content.length > 0 &&
        latest.content[0].type === "text"
      ) {
        responseText = latest.content[0].text.value;
      }
    }

    // Prepare the response
    const response = {
      threadId,
      paragraph: paragraphStore, // Include the paragraph if it was generated
      message: responseText || "No response generated",
      isNewThread,
      runStatus: runResult.status,
    };

    return Response.json(response);
  } catch (error: unknown) {
    console.error("Error in POST handler:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

// GET endpoint to retrieve the paragraph
export async function GET(req: Request) {
  const paragraph = paragraphStore;

  if (paragraph) {
    return Response.json({ paragraph });
  } else {
    return Response.json({ message: "No paragraph has been generated yet" });
  }
}
