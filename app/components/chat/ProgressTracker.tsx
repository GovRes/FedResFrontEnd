// ProgressTracker.tsx
import React from "react";
import { useChatContext } from "../../providers/chatContext";
import { useEditableParagraph } from "../../providers/editableParagraphContext";
import styles from "./chatInterface.module.css";
export default function ProgressTracker() {
  const { items, isEditingExistingParagraph } = useChatContext();
  const { itemBeingEdited } = useEditableParagraph();

  // Calculate progress
  const confirmedItems = items.filter((item) => item.userConfirmed).length;
  const totalItems = items.length;
  const progressPercentage =
    totalItems > 0 ? Math.round((confirmedItems / totalItems) * 100) : 0;

  // Find the name of the item being edited
  const editingItemName =
    isEditingExistingParagraph && itemBeingEdited
      ? items.find((item) => item.id === itemBeingEdited)?.title || "item"
      : null;

  return (
    <div className={styles.progressContainer}>
      {isEditingExistingParagraph && editingItemName ? (
        <div className={styles.editingStatus}>
          Currently editing: <strong>{editingItemName}</strong>
        </div>
      ) : (
        <div className={styles.progressText}>
          Progress: {confirmedItems} of {totalItems} completed (
          {progressPercentage}%)
        </div>
      )}

      <div className={styles.progressBarContainer}>
        <div
          className={`${styles.progressBar} ${
            isEditingExistingParagraph ? styles.editingProgress : ""
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
