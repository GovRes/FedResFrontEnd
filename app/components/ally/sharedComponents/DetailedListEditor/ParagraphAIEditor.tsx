"use client";
/* the code in this file allows users to interact with an AI which will eventually generate a paragraph for them and allow them to revise it. */
import { useState, useEffect } from "react";
import styles from "../../ally.module.css";

export default function ParagraphAIEditor({
  paragraphData,
  saveParagraph,
  setEditType,
  threadId,
}: {
  paragraphData: string;
  saveParagraph: Function;
  setEditType: Function;
  threadId: string | null;
}) {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localThreadId, setLocalThreadId] = useState<string | null>(threadId);
  const [localParagraphData, setLocalParagraphData] = useState<string>("");

  // Check for existing paragraph
  useEffect(() => {
    const checkForParagraph = async () => {
      try {
        const response = await fetch("/api/ai-editor");
        const data = await response.json();
        if (data.paragraph) {
          setLocalParagraphData(data.paragraph);
        }
      } catch (error) {
        console.error("Error checking for paragraph:", error);
      }
    };

    checkForParagraph();
  }, [messages]); // Check after messages change in case a paragraph was just generated
  const offerFeedback = () => {};
  // Function to save the paragraph

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message to UI immediately
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input and show loading
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      console.log("Sending message:", input);

      const response = await fetch("/api/ai-editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paragraphData,
          message: input,
          threadId: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Response received:", data);

      // Save thread ID for future requests
      if (data.threadId) {
        setLocalThreadId(data.threadId);
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
        setLocalParagraphData(data.paragraph);
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

  return (
    <div className={styles.chatContainer}>
      {/* Chat messages */}
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
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}

        {isLoading && (
          <div className={styles.allyChatContainer}>
            <strong>assistant:</strong> <em>Thinking...</em>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      <div className={styles.paragraphContainer}>
        <h3>Your Paragraph:</h3>
        <p>{localParagraphData}</p>
        <div>
          <button onClick={() => saveParagraph()}>
            This paragraph is great, save it and move on
          </button>
          <button onClick={() => setEditType("manual")}>
            I would like to manually edit this paragraph myself.
          </button>
        </div>
      </div>{" "}
      <div>
        {/* Input form */}
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What do you want to change?"
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
        </form>
      </div>
    </div>
  );
}
