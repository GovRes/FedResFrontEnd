// /api/assistant/route.tsx
import OpenAI from "openai";

// Create an OpenAI instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Create a simple in-memory store for paragraphs by thread ID
// In a production app, you would use a database
const paragraphStore: Record<string, string> = {};

// Shared assistant instance to avoid recreating it
let assistantInstance:
  | (OpenAI.Beta.Assistants.Assistant & { _request_id?: string | null })
  | null = null;

// Store the last instructions to detect changes
let lastInstructions: string = "";

// Helper function to check for active runs and cancel if needed
async function checkAndHandleActiveRuns(threadId: string) {
  try {
    const runs = await openai.beta.threads.runs.list(threadId);
    const activeRun = runs.data.find((run) =>
      ["queued", "in_progress", "requires_action"].includes(run.status)
    );

    if (activeRun) {
      await openai.beta.threads.runs.cancel(threadId, activeRun.id);

      // Brief delay to ensure cancellation is processed
      await new Promise((resolve) => setTimeout(resolve, 500));
    } else {
      console.log("No active runs found.");
    }
  } catch (error) {
    console.error("Error checking/cancelling active runs:", error);
    // Continue execution even if there's an error checking runs
  }
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();

    const {
      assistantInstructions,
      assistantName,
      initialMessage,
      message,
      threadId: existingThreadId,
    } = body;

    // Create or update the assistant
    if (!assistantInstance) {
      assistantInstance = await openai.beta.assistants.create({
        name: assistantName,
        instructions: assistantInstructions,
        model: "gpt-4o-mini",
        tools: [
          {
            type: "function",
            function: {
              name: "provideParagraph",
              parameters: {
                type: "object",
                properties: {
                  paragraph: {
                    type: "string",
                    description:
                      "The paragraph generated based on the user's experience.",
                  },
                },
                required: ["paragraph"],
                additionalProperties: false,
              },
            },
          },
        ],
      });
      lastInstructions = assistantInstructions;
    } else if (lastInstructions !== assistantInstructions) {
      // Instructions have changed - update the assistant

      assistantInstance = await openai.beta.assistants.update(
        assistantInstance.id,
        {
          instructions: assistantInstructions,
        }
      );
      lastInstructions = assistantInstructions;
    } else {
      console.log("Using existing assistant with same instructions");
    }

    // Create or use an existing thread
    let threadId = existingThreadId;
    let isNewThread = false;

    if (!threadId) {
      const thread = await openai.beta.threads.create({});
      threadId = thread.id;
      isNewThread = true;
      paragraphStore[threadId] = ""; // Initialize empty paragraph for this thread

      // Add initial assistant message for new threads
      if (initialMessage) {
        await openai.beta.threads.messages.create(threadId, {
          role: "assistant",
          content: initialMessage,
        });
      }
    } else {
      // For existing threads, check and handle any active runs
      await checkAndHandleActiveRuns(threadId);
    }

    // Add the user message to the thread if provided
    if (message) {
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message, // This should be a string with the user's message
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
          if (toolCall.function.name === "provideParagraph") {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const paragraphText = args.paragraph;

              paragraphStore[threadId] = paragraphText; // Store the paragraph for this specific thread

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
      paragraph: paragraphStore[threadId] || null, // Get paragraph specific to this thread
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
  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");

  if (!threadId) {
    return Response.json({ error: "No threadId provided" }, { status: 400 });
  }

  const paragraph = paragraphStore[threadId];

  if (paragraph) {
    // Clear the paragraph after retrieval but only for this thread
    delete paragraphStore[threadId];
    return Response.json({ paragraph });
  } else {
    return Response.json({
      message: "No paragraph has been generated for this thread yet",
    });
  }
}
