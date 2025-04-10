import { AllyContext } from "@/app/providers";
import { JSX, useContext, useEffect, useState } from "react";
import { Message, useAssistant } from "@ai-sdk/react";
import styles from "../../ally.module.css";
import {
  SpecializedExperienceType,
  UserJobQualificationType,
} from "@/app/utils/responseSchemas";
import SidebarItem from "./SidebarItem";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
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
  items: SpecializedExperienceType[] | UserJobQualificationType[];
  jobString: string;
  setFunction: (
    list: SpecializedExperienceType[] | UserJobQualificationType[]
  ) => void;
  setNext(): void;
  sidebarTitleText: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<
    SpecializedExperienceType | UserJobQualificationType
  >(items[currentIndex]);
  const [initialMessage, setInitialMessage] = useState(
    `Can you tell me more about your experience with ${currentItem.title}?`
  );
  useEffect(() => {
    setCurrentItem(items[currentIndex]);
    setInitialMessage(
      `I'm going to help you write a paragraph about ${items[currentIndex]?.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`
    );
  }, [currentIndex, items]);
  console.log(currentIndex);

  let itemsList: JSX.Element[] = [];

  async function saveItem(
    item: SpecializedExperienceType | UserJobQualificationType
  ) {
    let updatedItems = items.map((i) => (i.id !== item.id ? i : item));
    setFunction(updatedItems as typeof items);
  }

  if (items && items.length > 0) {
    itemsList = items.map(
      (item: SpecializedExperienceType | UserJobQualificationType, index) => {
        return (
          <SidebarItem
            currentIndex={currentIndex}
            index={index}
            key={item.id}
            setCurrentIndex={setCurrentIndex}
            item={item}
          />
        );
      }
    );
  }

  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>{heading}</h3>
      <div className={styles.detailedListEditorContent}>
        {/* sidebar */}
        <Sidebar
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          items={items}
          titleText={sidebarTitleText}
        />
        {/* ally chat */}
        <Chat
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
