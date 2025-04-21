"use client";
/* the code in this file allows users to interact with an AI which will eventually generate a paragraph for them and allow them to revise it. */
import {
  SpecializedExperienceType,
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import { useState, useEffect, FormEvent } from "react";
import styles from "../../ally.module.css";
import DetailedListEditorReturnedParagraph from "./ReturnedParagraph";

export default function Chat<
  T extends SpecializedExperienceType | UserJobQualificationType
>({
  assistantInstructions,
  assistantName,
  currentIndex,
  initialMessage,
  item,
  itemsLength,
  saveItem,
  setCurrentIndex,
  setNext,
}: {
  assistantInstructions: string;
  assistantName: string;
  currentIndex: number;
  initialMessage: string;
  item: T;
  itemsLength: number;
  saveItem: (item: T) => void;
  setCurrentIndex: (index: number) => void;
  setNext: () => void;
}) {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [paragraphData, setParagraphData] = useState<string | null>(
    item?.paragraph || null
  );
  const [editType, setEditType] = useState<string | null>(null);

  // Initialize with the welcome message
  useEffect(() => {
    setMessages([{ role: "assistant", content: initialMessage }]);
    console.log("Initial message set:", initialMessage);
  }, [initialMessage]);

  // Check for existing paragraph
  useEffect(() => {
    const checkForParagraph = async () => {
      try {
        const response = await fetch("/api/detailed-chat");
        const data = await response.json();
        if (data.paragraph) {
          setParagraphData(data.paragraph);
        }
      } catch (error) {
        console.error("Error checking for paragraph:", error);
      }
    };

    checkForParagraph();
  }, [messages]); // Check after messages change in case a paragraph was just generated
  // Function to save the paragraph
  const handleParagraphSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!paragraphData) return;
    setEditType(null);
    await saveParagraph();
  };
  const saveParagraph = async () => {
    if (!paragraphData) return;
    saveItem({ ...item, paragraph: paragraphData, userConfirmed: true });
    window.scroll(0, 0);
    if (currentIndex != itemsLength - 1) {
      setCurrentIndex(currentIndex + 1);
      setEditType(null);
      setInput("");
      setParagraphData(null);
      setThreadId("");
    } else {
      setCurrentIndex(0);
      setEditType(null);
      setInput("");
      setParagraphData(null);
      setThreadId("");
      setNext();
    }
  };
  const handleChatSubmit = async (e: React.FormEvent) => {
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

      const response = await fetch("/api/detailed-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantInstructions: `${assistantInstructions}. Here are some more details about this item: ${item.title} - ${item.description}`,
          assistantName,
          initialMessage,
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

        {/* paragraph display */}
        {paragraphData ? (
          <DetailedListEditorReturnedParagraph
            editType={editType}
            paragraphData={paragraphData}
            handleParagraphSubmit={handleParagraphSubmit}
            saveParagraph={saveParagraph}
            setEditType={setEditType}
            setParagraphData={setParagraphData}
            threadId={threadId}
          />
        ) : (
          <div>
            {/* Input form */}
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
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
