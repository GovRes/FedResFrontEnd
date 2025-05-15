import { JSX, useEffect, useState } from "react";
import styles from "../../ally.module.css";
import {
  SpecializedExperienceType,
  PastJobQualificationType,
} from "@/app/utils/responseSchemas";
import SidebarItem from "./SidebarItem";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
export default function DetailedListEditor<
  T extends SpecializedExperienceType | PastJobQualificationType
>({
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
  items: T[];
  jobString: string;
  setFunction: (list: T[]) => void;
  setNext: Function;
  sidebarTitleText: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<T>(items[currentIndex]);
  const [initialMessage, setInitialMessage] = useState("");
  function allItemsComplete() {
    if (items.every((item) => item.userConfirmed)) {
      setNext();
    } else {
      determineNextItemIndex();
    }
  }
  function determineNextItemIndex() {
    let nextIndex = currentIndex + 1;

    // If we've reached the end, start over
    if (nextIndex >= items.length) {
      nextIndex = 0;
    }

    // Find the first unconfirmed item, starting from nextIndex
    let tempIndex = nextIndex;
    const startIndex = nextIndex; // Remember where we started to avoid infinite loop

    do {
      if (!items[tempIndex].userConfirmed) {
        setCurrentIndex(tempIndex);
        return;
      }
      tempIndex = (tempIndex + 1) % items.length; // Wrap around to beginning if needed
    } while (tempIndex !== startIndex); // Stop when we've checked all items

    // If all items are confirmed, just stay at current index
    setCurrentIndex(currentIndex);
  }
  useEffect(() => {
    determineNextItemIndex();
    setInitialMessage(
      `I'm going to help you write a paragraph about ${items[currentIndex]?.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`
    );
  }, [currentIndex, items]);

  let itemsList: JSX.Element[] = [];

  async function saveItem(item: T) {
    let updatedItems = items.map((i) => (i.id !== item.id ? i : item));
    setFunction(updatedItems as typeof items);
  }

  if (items && items.length > 0) {
    itemsList = items.map((item: T, index) => {
      return (
        <SidebarItem
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
          setNext={allItemsComplete}
        />
      </div>
    </div>
  );
}
