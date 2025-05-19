import React from "react";
import { ChatProvider, BaseItem } from "../../providers/chatContext";
import Sidebar from "./Sidebar";
import ChatInterface from "./ChatInterface";
import ProgressTracker from "./ProgressTracker";
import styles from "./chatInterface.module.css";

type ChatLayoutProps<T extends BaseItem> = {
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
  isNestedView?: boolean;
};

export default function ChatLayout<T extends BaseItem>({
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
  isNestedView = false,
}: ChatLayoutProps<T>) {
  return (
    <ChatProvider
      initialItems={items}
      initialAssistantName={assistantName}
      initialAssistantInstructions={assistantInstructions}
      initialJobString={jobString}
      saveFunction={saveFunction}
      onComplete={onComplete}
      nestedItemsKey={nestedItemsKey}
      parentId={parentId}
    >
      <div className={styles.chatLayoutContainer}>
        {heading && <h3 className={styles.chatLayoutHeading}>{heading}</h3>}

        {/* Add progress tracker */}
        <ProgressTracker />

        <div className={styles.chatLayoutContent}>
          <Sidebar title={sidebarTitle} displayNestedItems={isNestedView} />
          <ChatInterface />
        </div>
      </div>
    </ChatProvider>
  );
}
