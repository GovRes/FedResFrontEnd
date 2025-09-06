import React, { useState, useEffect, FormEvent } from "react";
import { useChatContext } from "../../providers/chatContext";
import { useEditableParagraph } from "../../providers/editableParagraphContext";
import {
  pastJobsAssistantInstructions,
  pastJobsAssistantName,
} from "@/lib/prompts/pastJobsWriterPrompt";
import styles from "./chatInterface.module.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

// Utility function to highlight keywords in generated paragraphs
function highlightKeywords(text: string, keywords: string[]): string {
  if (!keywords || keywords.length === 0) return text;

  let highlightedText = text;

  // Sort keywords by length (longest first) to avoid partial matches
  const sortedKeywords = keywords
    .filter((keyword) => keyword && keyword.trim().length > 0)
    .sort((a, b) => b.length - a.length);

  sortedKeywords.forEach((keyword) => {
    // Create regex that matches whole words and phrases, case insensitive
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi");

    // Replace matches that aren't already bolded
    highlightedText = highlightedText.replace(regex, (match, offset) => {
      const beforeMatch = highlightedText.substring(0, offset);
      const afterMatch = highlightedText.substring(offset + match.length);

      // Check if already inside ** markers
      const lastDoubleStar = beforeMatch.lastIndexOf("**");
      const nextDoubleStar = afterMatch.indexOf("**");

      // If we find ** before and after, and they're the closest ones, skip
      if (lastDoubleStar !== -1 && nextDoubleStar !== -1) {
        const beforeLastStar = beforeMatch.substring(0, lastDoubleStar);
        const openStars = (beforeLastStar.match(/\*\*/g) || []).length;
        if (openStars % 2 === 0) {
          return match; // Already bolded
        }
      }

      return `**${match}**`;
    });
  });

  return highlightedText;
}

export default function ChatInterface() {
  // Get context data
  const {
    additionalContext,
    currentItem,
    paragraphData,
    setParagraphData,
    saveParagraph,
    assistantName,
    assistantInstructions,
    jobString,
    isEditingExistingParagraph,
  } = useChatContext();

  const { editMode, setEditMode, cancelEditing } = useEditableParagraph();

  // Local state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isInFeedbackMode, setIsInFeedbackMode] = useState(false);

  // Common prompt suggestions
  const userPrompts = [
    "Can you give me an example?",
    "I'm not sure what you mean by that. Can you ask me in a different way?",
    "Can you clarify that?",
    "I'm having trouble thinking of an example. Can you help me?",
    "Explain that a little more",
    "I have a question for you",
  ];

  // Special prompts for editing mode
  const editingPrompts = [
    "Can you improve this paragraph?",
    "This paragraph needs to be more detailed.",
    "Make this paragraph more concise.",
    "Can you emphasize my technical skills more?",
    "Rewrite this to sound more professional.",
  ];

  // Initialize random prompts on component mount and when messages change
  const [randomPrompts, setRandomPrompts] = useState<string[]>([]);

  useEffect(() => {
    // Use different prompts when editing versus creating new content
    const promptsToUse = isEditingExistingParagraph
      ? editingPrompts
      : userPrompts;
    const shuffled = [...promptsToUse].sort(() => 0.5 - Math.random());
    setRandomPrompts(shuffled.slice(0, 2));
  }, [JSON.stringify(messages), isEditingExistingParagraph]);

  // Initialize with welcome message
  useEffect(() => {
    if (currentItem && !isInFeedbackMode) {
      let initialMessage = "";

      if (isEditingExistingParagraph) {
        // For editing mode, reference the existing paragraph
        initialMessage = `I see you want to edit your paragraph about "${currentItem.title}". Here's the current paragraph:
        
        "${paragraphData}"
        
        How would you like to improve it? You can give me specific instructions, or I can suggest improvements.`;
      } else {
        // For creating new content
        initialMessage = `${currentItem.question}`;
      }

      // Reset state for new item
      setThreadId(null);
      setMessages([{ role: "assistant", content: initialMessage }]);
    }
  }, [
    currentItem,
    jobString,
    isEditingExistingParagraph,
    paragraphData,
    isInFeedbackMode,
  ]);

  // Handle chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to UI immediately
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input and show loading
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Determine which assistant to use based on context
      const usesPastJobsAssistant =
        pastJobsAssistantName && pastJobsAssistantInstructions;
      const selectedAssistantName = usesPastJobsAssistant
        ? pastJobsAssistantName
        : assistantName;
      const selectedAssistantInstructions = usesPastJobsAssistant
        ? pastJobsAssistantInstructions
        : assistantInstructions;

      // Customize instructions based on whether we're editing or creating
      let customInstructions = selectedAssistantInstructions;

      if (isEditingExistingParagraph) {
        customInstructions = `${selectedAssistantInstructions}. The user is editing an existing paragraph about "${currentItem?.title}". 
        Here is their current paragraph: "${paragraphData}". 
        Help them improve it based on their feedback. If you generate a new paragraph, make sure it builds on the existing content.`;
      }
      const response = await fetch("/api/detailed-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantInstructions: `${customInstructions}. Here are some more details about this item: ${JSON.stringify(
            currentItem
          )}. ${
            additionalContext &&
            "here is information about prior job experience that you should use.: "
          }${additionalContext ? JSON.stringify(additionalContext) : ""}`,
          assistantName: selectedAssistantName,
          message: input,
          threadId: threadId,
          // Pass the current paragraph if in editing mode
          existingParagraph: isEditingExistingParagraph ? paragraphData : null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Save thread ID for future requests
      if (data.threadId) {
        setThreadId(data.threadId);
      }

      // Add assistant response to messages
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      }

      // Update paragraph data if provided
      if (data.paragraph) {
        setParagraphData(data.paragraph);
        // Reset feedback mode when new paragraph is generated
        setIsInFeedbackMode(false);
      }

      // Handle errors
      if (data.error) {
        setError(data.error);
      }

      // Handle timeouts
      if (data.timedOut) {
        setError("The assistant took too long to respond. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error sending message:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle paragraph submission
  const handleParagraphSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paragraphData) return;

    try {
      await saveParagraph();
    } catch (error) {
      console.error("Error saving paragraph:", error);
      setError("Failed to save paragraph. Please try again.");
    }
  };

  // Handle manual edit of paragraph
  const handleManualEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setParagraphData(e.target.value);
  };

  // Handle editing a generated paragraph
  const handleEditParagraph = () => {
    // Switch to manual edit mode for the generated paragraph
    setEditMode("manual");
  };

  // Handle completing manual edit of a generated paragraph
  const handleDoneEditing = () => {
    // For newly generated paragraphs, just return to chat mode to show the paragraph
    setEditMode("chat");
  };

  // Handle giving feedback on a generated paragraph
  const handleGiveFeedback = () => {
    // Set feedback mode to prevent useEffect from resetting messages
    setIsInFeedbackMode(true);

    // Add the current paragraph to the chat history so both user and AI can reference it
    // Then clear it from the paragraph display area
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Here's the paragraph I generated:\n\n"${paragraphData}"\n\nWhat would you like me to change or improve? I can modify this version based on your feedback.`,
      },
    ]);

    // Clear the paragraph from the display area to show chat interface
    setParagraphData("");
  };

  // Switch between chat and manual editing modes
  const toggleEditMode = () => {
    setEditMode(editMode === "chat" ? "manual" : "chat");
  };

  // Cancel editing and go back
  const handleCancelEdit = () => {
    cancelEditing();
  };

  // Determine which assistant name to display
  const displayAssistantName =
    pastJobsAssistantName && pastJobsAssistantInstructions
      ? pastJobsAssistantName
      : assistantName;

  // Render prompt suggestion buttons
  const renderPromptButtons = () => (
    <div className={styles.promptButtons}>
      {randomPrompts.map((prompt, index) => (
        <button
          key={index}
          type="button"
          onClick={() => setInput(prompt)}
          className={styles.promptButton}
        >
          {prompt}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.chatContainer}>
      {/* Heading that shows editing state */}
      {isEditingExistingParagraph && (
        <div className={styles.editingHeader}>
          <span>Editing Existing Paragraph</span>
          <div className={styles.editingControls}>
            <button
              onClick={toggleEditMode}
              className={`${styles.editModeButton} ${
                editMode === "chat" ? styles.active : ""
              }`}
            >
              Chat Mode
            </button>
            <button
              onClick={toggleEditMode}
              className={`${styles.editModeButton} ${
                editMode === "manual" ? styles.active : ""
              }`}
            >
              Manual Edit
            </button>
            <button onClick={handleCancelEdit} className={styles.cancelButton}>
              Cancel Editing
            </button>
          </div>
        </div>
      )}

      {/* Chat Mode */}
      {(!isEditingExistingParagraph ||
        (isEditingExistingParagraph && editMode === "chat")) && (
        <div className={styles.chatBox}>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.role === "assistant"
                  ? styles.allyChatContainer
                  : styles.userChatContainer
              }
            >
              <strong>
                {msg.role === "assistant" ? displayAssistantName : "You"}:
              </strong>{" "}
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className={styles.allyChatContainer}>
              <strong>{displayAssistantName}:</strong> <em>Thinking...</em>
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Paragraph display with keyword highlighting */}
          {paragraphData ? (
            <div className={styles.paragraphContainer}>
              <h3>Generated Paragraph</h3>
              <div
                className={styles.paragraphText}
                dangerouslySetInnerHTML={{
                  __html: highlightKeywords(
                    paragraphData,
                    currentItem?.keywords || []
                  ).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                }}
              />

              <div className={styles.paragraphActions}>
                <form onSubmit={handleParagraphSubmit}>
                  <button type="submit" className={styles.acceptButton}>
                    {isEditingExistingParagraph
                      ? "Save Changes"
                      : "Accept & Continue"}
                  </button>
                </form>

                {/* Add options for newly generated paragraphs */}
                {!isEditingExistingParagraph && (
                  <>
                    <button
                      type="button"
                      onClick={handleEditParagraph}
                      className={styles.editButton}
                    >
                      Edit Manually
                    </button>
                    <button
                      type="button"
                      onClick={handleGiveFeedback}
                      className={styles.feedbackButton}
                    >
                      Give Feedback & Regenerate
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Chat input form */}
              <form onSubmit={handleChatSubmit} className={styles.inputForm}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message here..."
                  disabled={loading}
                  className={styles.inputTextarea}
                />

                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className={styles.submitButton}
                >
                  {loading ? "Sending..." : "Send"}
                </button>

                {renderPromptButtons()}
              </form>
            </div>
          )}
        </div>
      )}

      {/* Manual Edit Mode - show when editing existing paragraph OR when user wants to edit generated paragraph */}
      {((isEditingExistingParagraph && editMode === "manual") ||
        (!isEditingExistingParagraph && editMode === "manual")) && (
        <div className={styles.manualEditContainer}>
          <h3>Manual Edit Mode</h3>
          <p className={styles.editInstructions}>
            Edit the paragraph directly in the text box below. When you're
            finished, click{" "}
            {isEditingExistingParagraph ? '"Save Changes"' : '"Done Editing"'}.
          </p>

          <textarea
            value={paragraphData || ""}
            onChange={handleManualEdit}
            className={styles.manualEditTextarea}
            rows={12}
          />

          <div className={styles.manualEditActions}>
            <button
              onClick={() => setEditMode("chat")}
              className={styles.cancelButton}
            >
              {isEditingExistingParagraph ? "Cancel" : "Back to Chat"}
            </button>

            {isEditingExistingParagraph ? (
              <form onSubmit={handleParagraphSubmit}>
                <button type="submit" className={styles.acceptButton}>
                  Save Changes
                </button>
              </form>
            ) : (
              <button
                onClick={handleDoneEditing}
                className={styles.acceptButton}
              >
                Done Editing
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
