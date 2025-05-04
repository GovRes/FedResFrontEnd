import {
  AwardType,
  EducationType,
  PastJobQualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import styles from "../ally.module.css";
import EditItem from "./EditItem";

export default function Details<
  T extends AwardType | EducationType | PastJobType | PastJobQualificationType
>({
  Form,
  itemType,
  localItems,
  setLocalItems,
  setNext,
}: {
  Form: React.ComponentType<{
    item: T;
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }>;
  itemType: string;
  localItems: T[];
  setLocalItems: React.Dispatch<React.SetStateAction<T[]>>;
  setNext: Function;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentItem, setCurrentItem] = useState<T>(localItems[currentIndex]);

  useEffect(() => {
    setCurrentItem(localItems[currentIndex]);
  }, [currentIndex, localItems]);

  // Create a function to generate default items
  function createDefaultItem(): T {
    if (itemType === "award") {
      return { id: crypto.randomUUID(), title: "", date: "" } as unknown as T;
    } else if (itemType === "education") {
      return {
        id: crypto.randomUUID(),
        title: "",
        degree: "",
        major: "",
        school: "",
        graduationDate: "",
      } as unknown as T;
    } else if (itemType === "past job" || itemType === "volunteer experience") {
      return {
        id: crypto.randomUUID(),
        title: "",
        organization: "",
        startDate: "",
        endDate: "",
        responsibilities: "",
        PastJobQualifications: [],
      } as unknown as T;
    } else {
      // Fallback
      return { id: crypto.randomUUID(), title: "" } as unknown as T;
    }
  }

  function removeItem(id: string) {
    setLocalItems((prev) => prev.filter((item) => item.id !== id));
  }
  function saveItem(item: T) {
    setLocalItems((prev) =>
      prev.map((prevItem) => (prevItem.id === item.id ? item : prevItem))
    );
  }

  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>Job Details</h3>
      <div className={styles.detailedListEditorContent}>
        {/* sidebar */}
        <Sidebar
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          items={localItems}
          titleText="Past Jobs"
        />
        <EditItem
          currentIndex={currentIndex}
          Form={Form}
          item={currentItem}
          itemType={itemType}
          itemsLength={localItems.length}
          removeItem={removeItem}
          saveItem={saveItem}
          setCurrentIndex={setCurrentIndex}
          setNext={setNext}
        />
      </div>
    </div>
  );
}
