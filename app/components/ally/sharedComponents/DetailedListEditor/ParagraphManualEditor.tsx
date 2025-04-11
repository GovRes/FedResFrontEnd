import styles from "../../ally.module.css";
import { FormEvent, useState } from "react";

export default function ParagraphManualEditor({
  paragraphData,
  handleParagraphSubmit,
  saveParagraph,
  setEditType,
  setParagraphData,
}: {
  paragraphData: string;
  handleParagraphSubmit: (e: FormEvent<HTMLFormElement>) => void;
  saveParagraph: Function;
  setEditType: Function;
  setParagraphData: (data: string) => void;
}) {
  const [input, setInput] = useState(paragraphData);
  const [isLoading, setIsLoading] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParagraphData(input);
    setInput("");
    handleParagraphSubmit(e);
  }
  return (
    <div>
      <form onSubmit={onSubmit} className={styles.inputForm}>
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
      <div>
        <button onClick={() => saveParagraph()}>
          This paragraph is great, save it and move on
        </button>
        <button onClick={() => setEditType("aiEditor")}>
          I would like to suggest an edit or request a change.
        </button>
      </div>
    </div>
  );
}
