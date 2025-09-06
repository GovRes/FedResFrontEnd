import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const paragraphStore: Record<string, string> = {};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      assistantInstructions,
      assistantName,
      initialMessage,
      message,
      threadId: existingThreadId, // This is actually the previous_response_id
    } = body;

    const functionSchema = {
      type: "object",
      properties: {
        response_type: {
          type: "string",
          enum: ["conversation", "paragraph_generated"],
          description:
            "Whether this is a conversational response or a final paragraph",
        },
        message: {
          type: "string",
          description: "The conversational response to the user",
        },
        paragraph: {
          type: "string",
          description:
            "The generated paragraph (only when response_type is 'paragraph_generated')",
        },
        success: {
          type: "boolean",
          description: "Whether the operation was successful",
        },
      },
      required: ["response_type", "message", "success"],
      additionalProperties: false,
    };

    // Build the input - OpenAI handles conversation state automatically
    let inputText = "";

    if (message) {
      // For continuing conversations, just pass the current message
      // OpenAI will automatically include previous context via previous_response_id
      inputText = message;
    } else if (initialMessage) {
      // For new conversations
      inputText = initialMessage;
    } else {
      inputText = `Hello, I'd like help creating a paragraph for my federal resume using ${assistantName}.`;
    }

    // Enhanced instructions that work with OpenAI's state management
    const enhancedInstructions = `${assistantInstructions}

CONVERSATION FLOW INSTRUCTIONS:
- You are having an ongoing conversation with the user to gather detailed information for their federal resume
- OpenAI is automatically maintaining the conversation context for you
- Only generate a paragraph when you have sufficient specific, detailed information including:
  * Multiple concrete examples with metrics and timeframes  
  * Tools, processes, or methodologies used
  * Measurable outcomes or achievements
  * Context about complexity or challenges overcome
- If you need more information, ask ONE specific follow-up question
- When you have enough information, set response_type to "paragraph_generated" and provide the paragraph
- When continuing the conversation, set response_type to "conversation" and ask your follow-up question
- Be conversational and reference previous parts of our discussion naturally`;

    console.log("=== CONVERSATION DEBUG ===");
    console.log("Assistant name:", assistantName);
    console.log("Has previous response ID:", !!existingThreadId);
    console.log("Input text:", inputText);
    console.log("=========================");

    // Create the response - OpenAI handles state automatically
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: inputText,
      instructions: enhancedInstructions,
      text: {
        format: {
          type: "json_schema",
          name: "federal_resume_response",
          strict: false,
          schema: functionSchema,
        },
      },
      temperature: 0.7,
      store: true, // Enable state storage (default is true)
      // This is the key - pass the previous response ID to continue the conversation
      previous_response_id: existingThreadId || undefined,
    });

    console.log("=== RESPONSE DEBUG ===");
    console.log("Response ID:", completion.id);
    console.log("Response received:", !!completion.output_text);
    console.log("Raw output:", completion.output_text?.substring(0, 300));
    console.log("======================");

    let responseText = "";
    let generatedParagraph = null;
    let isConversationComplete = false;

    if (completion.output_text) {
      try {
        const parsedContent = JSON.parse(completion.output_text);

        responseText =
          parsedContent.message ||
          "I'm here to help you create your federal resume paragraph.";

        if (
          parsedContent.response_type === "paragraph_generated" &&
          parsedContent.paragraph
        ) {
          // Paragraph has been generated
          generatedParagraph = parsedContent.paragraph;
          paragraphStore[completion.id] = generatedParagraph;
          isConversationComplete = true;
        }
        // If response_type is "conversation", we continue the conversation
      } catch (parseError) {
        console.error("Parse error:", parseError);
        // Fallback to raw response if JSON parsing fails
        responseText = completion.output_text;
      }
    }

    const response = {
      threadId: completion.id, // Use the response ID as the thread ID for next request
      paragraph: generatedParagraph,
      message: responseText,
      isNewThread: !existingThreadId,
      runStatus: "completed",
      conversationComplete: isConversationComplete,
    };

    return Response.json(response);
  } catch (error: unknown) {
    console.error("Error in POST handler:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");

  if (!threadId) {
    return Response.json({ error: "No threadId provided" }, { status: 400 });
  }

  const paragraph = paragraphStore[threadId];

  if (paragraph) {
    delete paragraphStore[threadId];
    return Response.json({ paragraph });
  } else {
    return Response.json({
      message: "No paragraph has been generated for this thread yet",
    });
  }
}

// Optional: Add endpoint to retrieve conversation history
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { responseId } = body;

    if (!responseId) {
      return Response.json(
        { error: "No responseId provided" },
        { status: 400 }
      );
    }

    // Retrieve the full conversation context from OpenAI
    const retrievedResponse = await openai.responses.retrieve(responseId);

    return Response.json({
      conversationHistory: retrievedResponse.output_text,
      responseId: retrievedResponse.id,
    });
  } catch (error: unknown) {
    console.error("Error retrieving conversation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
