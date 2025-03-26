import { AllyContext } from "@/app/providers";
import { useContext, useEffect } from "react";
import { Message, useAssistant } from "@ai-sdk/react";
export default function InDepthReview() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { specializedExperiences, setSpecializedExperiences } = context;
  const {
    status,
    messages,
    input,
    setMessages,
    submitMessage,
    handleInputChange,
  } = useAssistant({
    api: "/api/assistant",
    body: {
      initialMessage:
        "Can you tell me about your skills in working with IT systems?",
    },
  });

  useEffect(() => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "What is your favorite color?",
      },
    ]);
  }, []);
  return (
    <>
      <div className="chat-box">
        {messages.map((msg: Message) => (
          <div key={msg.id} className="chat-message">
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={submitMessage} className="fixed bottom-0 p-2 w-full">
        <input
          disabled={status !== "awaiting_message"}
          value={input}
          onChange={handleInputChange}
          className="bg-zinc-100 w-full p-2"
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
}
