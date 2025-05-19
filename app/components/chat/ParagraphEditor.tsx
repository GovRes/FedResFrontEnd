import React, { useState, FormEvent } from "react";
import { useChatContext } from "../../providers/chatContext";
import styles from "./chatInterface.module.css";

type ParagraphEditorProps = {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function ParagraphEditor({ onSubmit }: ParagraphEditorProps) {
  const { paragraphData, setParagraphData } = useChatContext();
  const [isEditing, setIsEditing] = useState(false);
  const [localParagraph, setLocalParagraph] = useState(paragraphData);

  // When paragraph data changes, update local state
  React.useEffect(() => {
    setLocalParagraph(paragraphData);
  }, [paragraphData]);

  // Start editing mode
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Cancel editing and revert to original
  const handleCancel = () => {
    setLocalParagraph(paragraphData);
    setIsEditing(false);
  };

  // Save edits
  const handleSave = () => {
    if (setParagraphData && localParagraph) {
      setParagraphData(localParagraph);
    }
    setIsEditing(false);
  };

  // Handle text changes in edit mode
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalParagraph(e.target.value);
  };

  return (
    <div className={styles.paragraphContainer}>
      <h3>Generated Paragraph</h3>

      {isEditing ? (
        <div className={styles.editContainer}>
          <textarea
            value={localParagraph || ""}
            onChange={handleChange}
            className={styles.editTextarea}
            rows={8}
          />
          <div className={styles.editButtonGroup}>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSave} className={styles.saveButton}>
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.paragraphText}>{paragraphData}</div>
          <div className={styles.paragraphActions}>
            <button onClick={handleEdit} className={styles.editButton}>
              Edit Paragraph
            </button>

            <form onSubmit={onSubmit}>
              <button type="submit" className={styles.acceptButton}>
                Accept & Continue
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
