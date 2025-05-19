import { JSX, useEffect, useState } from "react";
import styles from "../../ally.module.css";
import {
  SpecializedExperienceType,
  QualificationType,
} from "@/app/utils/responseSchemas";
import SidebarItem from "./SidebarItem";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
export default function DetailedListEditor<
  T extends SpecializedExperienceType | QualificationType
>({
  assistantInstructions,
  assistantName,
  heading,
  items,
  jobString,
  navigateToNextUnconfirmedJob,
  setNext,
  setFunction,
  sidebarTitleText,
}: {
  assistantInstructions: string;
  assistantName: string;
  heading?: string;
  items: T[];
  jobString: string;
  navigateToNextUnconfirmedJob: Function;
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
    let nextIndex = currentIndex;

    // If we've reached the end, start over
    if (nextIndex >= items.length) {
      nextIndex = 0;
    }

    // Find the first unconfirmed item, starting from nextIndex
    let tempIndex = nextIndex;
    const startIndex = nextIndex; // Remember where we started to avoid infinite loop

    do {
      console.log(56, items[tempIndex]);
      if (!items[tempIndex].userConfirmed) {
        console.log(57, items[tempIndex]);
        if (tempIndex !== currentIndex) {
          // Only update if it's different
          setCurrentIndex(tempIndex);
        }
        return tempIndex; // Return the index of the first unconfirmed item
      }
      tempIndex = (tempIndex + 1) % items.length; // Wrap around to beginning if needed
    } while (tempIndex !== startIndex); // Stop when we've checked all items

    // If we get here, all items are confirmed
    navigateToNextUnconfirmedJob();
    return currentIndex; // Return current index if all items are confirmed
  }

  useEffect(() => {
    // Only run determineNextItemIndex() on initial render or when items change
    // but NOT when currentIndex changes (to avoid the loop)
    if (items.length > 0) {
      setInitialMessage(
        `I'm going to help you write a paragraph about ${items[currentIndex]?.title} to include in your application for ${jobString}. Can you tell me a bit about your experience?`
      );
    }
  }, [currentIndex, items, jobString]);

  // Separate effect for finding the next unconfirmed item, only runs when items change
  useEffect(() => {
    if (items.length > 0) {
      determineNextItemIndex();
    }
  }, [items]); // Removed currentIndex from dependencies

  let itemsList: JSX.Element[] = [];

  async function saveItem(item: T) {
    console.log(87, item);
    console.log(item.id);
    console.log(items.map((i) => i.id));
    let updatedItems = items.map((i) => (i.id !== item.id ? i : item));
    console.log(89, updatedItems);
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
