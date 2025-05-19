import React, { useState, useEffect, FormEvent } from "react";
import { useChatContext, BaseItem } from "../../providers/chatContext";
import styles from "./chatInterface.module.css";
import ParagraphEditor from "./ParagraphEditor";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatInterface() {
  // Get context data
  const {
    currentItem,
    paragraphData,
    setParagraphData,
    saveParagraph,
    assistantName,
    assistantInstructions,
    jobString,
  } = useChatContext();

  // Local state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [editType, setEditType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>("You");
  // Common prompt suggestions
  const userPrompts = [
    "Can you give me an example?",
    "I'm not sure what you mean by that. Can you ask me in a different way?",
    "Can you clarify that?",
    "I'm having trouble thinking of an example. Can you help me?",
    "Explain that a little more",
    "I have a question for you",
  ];
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);

  useEffect(() => {
    async function getUserAttributes() {
      if (authStatus === "authenticated") {
        const attrRes = await fetchUserAttributes();
        setUserName(attrRes.given_name || "You");
      }
    }
    getUserAttributes();
  }, [user, authStatus]);

  // Initialize random prompts on component mount and when messages change
  const [randomPrompts, setRandomPrompts] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = [...userPrompts].sort(() => 0.5 - Math.random());
    setRandomPrompts(shuffled.slice(0, 2));
  }, [JSON.stringify(messages)]);

  // Make sure the chat is reset when a new conversation starts
  useEffect(() => {
    // Clear chat state when a new item is selected
    setMessages([]);
    setThreadId(null);
    setParagraphData(null);
    setError(null);

    // Initialize with welcome message
    if (currentItem) {
      const initialMessage = `I'm going to help you write a paragraph about ${currentItem.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`;
      setMessages([{ role: "assistant", content: initialMessage }]);
    }
  }, [currentItem, jobString, setParagraphData]);

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
      const response = await fetch("/api/detailed-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantInstructions: `${assistantInstructions}. Here are some more details about this item: ${currentItem?.title} - ${currentItem?.description}`,
          assistantName,
          message: input,
          threadId: threadId,
          initialMessage: threadId
            ? undefined
            : `I'm going to help you write a paragraph about ${currentItem?.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`,
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
    setEditType(null);

    try {
      await saveParagraph();

      // Reset interface after submitting paragraph
      setMessages([]);
      setThreadId(null);
      setParagraphData(null);

      // Re-initialize with welcome message if needed
      if (currentItem) {
        const initialMessage = `I'm going to help you write a paragraph about ${currentItem.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`;
        setMessages([{ role: "assistant", content: initialMessage }]);
      }
    } catch (error) {
      console.error("Error saving paragraph:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while saving"
      );
    }
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
            <strong>
              {msg.role === "assistant" ? assistantName : userName}:
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

        {/* Paragraph display with ParagraphEditor */}
        {paragraphData ? (
          <ParagraphEditor onSubmit={handleParagraphSubmit} />
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
    </div>
  );
}
