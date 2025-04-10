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

// Helper function to check for active runs and cancel if needed
async function checkAndHandleActiveRuns(threadId: string) {
  try {
    console.log("Checking for active runs...");
    const runs = await openai.beta.threads.runs.list(threadId);
    const activeRun = runs.data.find((run) =>
      ["queued", "in_progress", "requires_action"].includes(run.status)
    );

    if (activeRun) {
      console.log(
        `Found active run ${activeRun.id} with status ${activeRun.status}. Cancelling...`
      );
      await openai.beta.threads.runs.cancel(threadId, activeRun.id);
      console.log(`Cancelled run ${activeRun.id}`);

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
  console.log("=== POST REQUEST RECEIVED ===");

  try {
    // Parse the request body
    const body = await req.json();
    console.log("Request body:", body);

    const {
      assistantInstructions,
      assistantName,
      initialMessage,
      message,
      threadId: existingThreadId,
    } = body;

    // Create or get the assistant
    if (!assistantInstance) {
      console.log("Creating new assistant...");
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
      console.log("Assistant created:", assistantInstance.id);
    }

    // Create or use an existing thread
    let threadId = existingThreadId;
    let isNewThread = false;

    if (!threadId) {
      console.log("Creating new thread...");
      const thread = await openai.beta.threads.create({});
      threadId = thread.id;
      isNewThread = true;
      paragraphStore = "";
      console.log("New thread created:", threadId);

      // Add initial assistant message for new threads
      await openai.beta.threads.messages.create(threadId, {
        role: "assistant",
        content: initialMessage,
      });
    } else {
      // For existing threads, check and handle any active runs
      await checkAndHandleActiveRuns(threadId);
    }

    // Add the user message to the thread if provided
    if (message) {
      console.log("Adding user message:", message);
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
      });
    }

    // Create a run
    console.log("Creating run with assistant:", assistantInstance.id);
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantInstance.id,
    });
    console.log("Run created:", run.id);

    // Poll for the run to complete (with timeout)
    let runResult = await openai.beta.threads.runs.retrieve(threadId, run.id);
    console.log("Initial run status:", runResult.status);

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
        console.log("Run requires action...");
        const toolCalls =
          runResult.required_action.submit_tool_outputs.tool_calls;

        const toolOutputs = [];
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === "provideParagraph") {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const paragraphText = args.paragraph;

              console.log("paragraph generated:", paragraphText);
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
          console.log("Submitting tool outputs");
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
      console.log("Checking run status...");
      runResult = await openai.beta.threads.runs.retrieve(threadId, run.id);
      console.log("Updated run status:", runResult.status);
    }

    // Check if we timed out
    if (
      Date.now() - startTime >= TIMEOUT_MS &&
      !["completed", "failed"].includes(runResult.status)
    ) {
      console.log("Run timed out");
      return Response.json({
        threadId,
        timedOut: true,
        message:
          "The assistant is taking longer than expected. Please try again.",
      });
    }

    // Get the messages from the thread
    console.log("Fetching messages...");
    const messages = await openai.beta.threads.messages.list(threadId);

    // Get the latest assistant message
    const assistantMessages = messages.data.filter(
      (msg) => msg.role === "assistant"
    );
    console.log(`Found ${assistantMessages.length} assistant messages`);

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

    console.log("Sending response:", {
      threadId: response.threadId,
      messagePreview: response.message.substring(0, 100) + "...",
      paragraph: response.paragraph ? "Generated" : "None",
      runStatus: response.runStatus,
    });

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
    paragraphStore = null; // Clear the paragraph after retrieval
    return Response.json({ paragraph });
  } else {
    return Response.json({ message: "No paragraph has been generated yet" });
  }
}
