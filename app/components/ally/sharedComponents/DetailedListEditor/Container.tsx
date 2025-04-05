import { AllyContext } from "@/app/providers";
import { JSX, useContext, useEffect, useState } from "react";
import { Message, useAssistant } from "@ai-sdk/react";
import styles from "../../ally.module.css";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import DetailedListEditorSidebarItem from "./SidebarItem";
import DetailedListEditorSidebar from "./Sidebar";
import DetailedListEditorChat from "./Chat";
import { jobDescriptionReviewer } from "../../../aiProcessing/jobDescriptionReviewer";
export default function DetailedListEditor({
  assistantInstructions,
  assistantName,
  heading,
  items,
  jobString,
  setNext,
  setFunction,
  sidebarTitleText,
}: {
  assistantInstructions: string;
  assistantName: string;
  heading?: string;
  items: SpecializedExperienceType[];
  jobString: string;
  setFunction: (list: SpecializedExperienceType[]) => void;
  setNext(): void;
  sidebarTitleText: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<SpecializedExperienceType>(
    items[currentIndex]
  );
  const [initialMessage, setInitialMessage] = useState(
    `Can you tell me more about your experience with ${currentItem.title}?`
  );
  useEffect(() => {
    setCurrentItem(items[currentIndex]);
    setInitialMessage(
      `I'm going to help you write a paragraph about ${items[currentIndex]?.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`
    );
  }, [currentIndex, items]);

  let itemsList: JSX.Element[] = [];

  async function saveItem(item: SpecializedExperienceType) {
    let updatedItems = items.map((i) => (i.id !== item.id ? i : item));
    setFunction(updatedItems);
  }

  if (items && items.length > 0) {
    itemsList = items.map((item: SpecializedExperienceType, index) => {
      return (
        <DetailedListEditorSidebarItem
          currentIndex={currentIndex}
          index={index}
          key={item.id}
          setCurrentIndex={setCurrentIndex}
          item={item}
        />
      );
    });
  }

  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>{heading}</h3>
      <div className={styles.detailedListEditorContent}>
        {/* sidebar */}
        <DetailedListEditorSidebar
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          items={items}
          titleText={sidebarTitleText}
        />
        {/* ally chat */}
        <DetailedListEditorChat
          assistantInstructions={assistantInstructions}
          assistantName={assistantName}
          currentIndex={currentIndex}
          initialMessage={initialMessage}
          item={currentItem}
          itemsLength={items.length}
          saveItem={saveItem}
          setCurrentIndex={setCurrentIndex}
          setNext={setNext}
        />
      </div>
    </div>
  );
}
