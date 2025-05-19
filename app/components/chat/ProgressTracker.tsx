import React from "react";
import { useChatContext } from "../../providers/chatContext";
import styles from "./chatInterface.module.css";

export default function ProgressTracker() {
  const { items } = useChatContext();

  // Calculate progress
  const confirmedItems = items.filter((item) => item.userConfirmed).length;
  const totalItems = items.length;
  const progressPercentage =
    totalItems > 0 ? Math.round((confirmedItems / totalItems) * 100) : 0;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressText}>
        Progress: {confirmedItems} of {totalItems} completed (
        {progressPercentage}%)
      </div>
      <div className={styles.progressBarContainer}>
        <div
          className={styles.progressBar}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}
