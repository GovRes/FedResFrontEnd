// EnhancedChatLayout.tsx
import React from "react";
import { ChatProvider, BaseItem } from "@/app/providers/chatContext";
import { EditableParagraphProvider } from "@/app/providers/editableParagraphContext";
import EnhancedSidebar from "./Sidebar";
import EnhancedChatInterface from "./ChatInterface";
import ProgressTracker from "./ProgressTracker";
import styles from "./chatInterface.module.css";

type EnhancedChatLayoutProps<T extends BaseItem> = {
  items: T[];
  saveFunction: (item: T) => Promise<void>;
  onComplete: () => void;
  assistantName: string;
  assistantInstructions: string;
  jobString: string;
  sidebarTitle: string;
  heading?: string;
  nestedItemsKey?: string;
  parentId?: string;
  currentStepId: string;
  isNestedView?: boolean;
  isEditMode?: boolean; // New prop to indicate we're in edit mode
};

export default function EnhancedChatLayout<T extends BaseItem>({
  items,
  saveFunction,
  onComplete,
  assistantName,
  assistantInstructions,
  jobString,
  sidebarTitle,
  heading,
  nestedItemsKey,
  parentId,
  currentStepId,
  isNestedView = false,
  isEditMode = false,
}: EnhancedChatLayoutProps<T>) {
  console.log(41, items);
  return (
    <div
      className={`${styles.chatLayoutContainer} ${
        isEditMode ? styles.editModeContainer : ""
      }`}
    >
      {isEditMode && (
        <div className={styles.editModeHeader}>
          <span>Edit Mode</span>
          <p>You are editing paragraphs that you've already completed.</p>
        </div>
      )}

      {heading && <h3 className={styles.chatLayoutHeading}>{heading}</h3>}

      <EditableParagraphProvider>
        <ChatProvider
          initialItems={items}
          initialAssistantName={assistantName}
          initialAssistantInstructions={assistantInstructions}
          initialJobString={jobString}
          saveFunction={(item: BaseItem) => saveFunction(item as T)}
          onComplete={onComplete}
          nestedItemsKey={nestedItemsKey}
          currentStepId={currentStepId}
          parentId={parentId}
          isEditMode={isEditMode}
        >
          <ProgressTracker />

          <div className={styles.chatLayoutContent}>
            <EnhancedSidebar
              title={sidebarTitle}
              displayNestedItems={isNestedView}
            />
            <EnhancedChatInterface />
          </div>
        </ChatProvider>
      </EditableParagraphProvider>
    </div>
  );
}
