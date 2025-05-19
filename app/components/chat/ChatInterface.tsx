// EnhancedChatInterface.tsx
import React, { useState, useEffect, FormEvent } from "react";
import { useChatContext } from "../../providers/chatContext";
import { useEditableParagraph } from "../../providers/editableParagraphContext";
import styles from "./chatInterface.module.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function EnhancedChatInterface() {
  // Get context data
  const {
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

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
    if (currentItem) {
      let initialMessage = "";

      if (isEditingExistingParagraph) {
        // For editing mode, reference the existing paragraph
        initialMessage = `I see you want to edit your paragraph about "${currentItem.title}". Here's the current paragraph:
        
        "${paragraphData}"
        
        How would you like to improve it? You can give me specific instructions, or I can suggest improvements.`;
      } else {
        // For creating new content
        initialMessage = `I'm going to help you write a paragraph about ${currentItem.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`;
      }

      setMessages([{ role: "assistant", content: initialMessage }]);
    }
  }, [currentItem, jobString, isEditingExistingParagraph, paragraphData]);

  // Handle chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to UI immediately
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input and show loading
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Customize instructions based on whether we're editing or creating
      let customInstructions = assistantInstructions;

      if (isEditingExistingParagraph) {
        customInstructions = `${assistantInstructions}. The user is editing an existing paragraph about "${currentItem?.title}". 
        Here is their current paragraph: "${paragraphData}". 
        Help them improve it based on their feedback. If you generate a new paragraph, make sure it builds on the existing content.`;
      }

      const response = await fetch("/api/detailed-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantInstructions: `${customInstructions}. Here are some more details about this item: ${currentItem?.title} - ${currentItem?.description}`,
          assistantName,
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
      setIsLoading(false);
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

  // Switch between chat and manual editing modes
  const toggleEditMode = () => {
    setEditMode(editMode === "chat" ? "manual" : "chat");
  };

  // Cancel editing and go back
  const handleCancelEdit = () => {
    cancelEditing();
  };

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
                {msg.role === "assistant" ? assistantName : "You"}:
              </strong>{" "}
              {msg.content}
            </div>
          ))}

          {isLoading && (
            <div className={styles.allyChatContainer}>
              <strong>{assistantName}:</strong> <em>Thinking...</em>
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Paragraph display */}
          {paragraphData ? (
            <div className={styles.paragraphContainer}>
              <h3>Generated Paragraph</h3>
              <div className={styles.paragraphText}>{paragraphData}</div>

              <div className={styles.paragraphActions}>
                <form onSubmit={handleParagraphSubmit}>
                  <button type="submit" className={styles.acceptButton}>
                    {isEditingExistingParagraph
                      ? "Save Changes"
                      : "Accept & Continue"}
                  </button>
                </form>
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
                  disabled={isLoading}
                  className={styles.inputTextarea}
                />

                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={styles.submitButton}
                >
                  {isLoading ? "Sending..." : "Send"}
                </button>

                {renderPromptButtons()}
              </form>
            </div>
          )}
        </div>
      )}

      {/* Manual Edit Mode */}
      {isEditingExistingParagraph && editMode === "manual" && (
        <div className={styles.manualEditContainer}>
          <h3>Manual Edit Mode</h3>
          <p className={styles.editInstructions}>
            Edit the paragraph directly in the text box below. When you're
            finished, click "Save Changes".
          </p>

          <textarea
            value={paragraphData || ""}
            onChange={handleManualEdit}
            className={styles.manualEditTextarea}
            rows={12}
          />

          <div className={styles.manualEditActions}>
            <button onClick={handleCancelEdit} className={styles.cancelButton}>
              Cancel
            </button>
            <form onSubmit={handleParagraphSubmit}>
              <button type="submit" className={styles.acceptButton}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
