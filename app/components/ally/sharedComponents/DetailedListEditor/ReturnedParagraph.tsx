import { FormEvent } from "react";
import styles from "../../ally.module.css";
import ParagraphAIEditor from "./ParagraphAIEditor";
import ParagraphManualEditor from "./ParagraphManualEditor";
export default function ReturnedParagraph({
  editType,
  handleParagraphSubmit,
  paragraphData,
  saveParagraph,
  setParagraphData,
  setEditType,
  threadId,
}: {
  editType: string | null;
  handleParagraphSubmit: (e: FormEvent<HTMLFormElement>) => void;
  paragraphData: string;
  saveParagraph: () => void;
  setEditType: Function;
  setParagraphData: (data: string) => void;
  threadId: string | null;
}) {
  return (
    <div className={styles.paragraphContainer}>
      <h3>Your Paragraph:</h3>
      <p>{paragraphData}</p>
      {!editType && (
        <div>
          <button onClick={() => saveParagraph()}>
            This paragraph is great, save it and move on
          </button>
          <button onClick={() => setEditType("manual")}>
            I would like to manually edit this paragraph myself.
          </button>
          <button onClick={() => setEditType("aiEditor")}>
            I would like to suggest an edit or request a change.
          </button>
        </div>
      )}
      {editType === "manual" && (
        <ParagraphManualEditor
          paragraphData={paragraphData}
          saveParagraph={saveParagraph}
          setEditType={setEditType}
          setParagraphData={setParagraphData}
          handleParagraphSubmit={handleParagraphSubmit}
        />
      )}
      {editType === "aiEditor" && (
        <ParagraphAIEditor
          paragraphData={paragraphData}
          saveParagraph={saveParagraph}
          setEditType={setEditType}
          threadId={threadId}
        />
      )}
    </div>
  );
}
