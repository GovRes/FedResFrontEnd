import {
  AwardType,
  EducationType,
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import { useState } from "react";
import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import styles from "../ally.module.css";

export default function Details<
  T extends AwardType | EducationType | UserJobType | UserJobQualificationType
>({
  Form,
  itemType,
  localItems,
  setLocalItems,
  setItemsStep,
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
  setItemsStep: React.Dispatch<React.SetStateAction<string>>;
}) {
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
        userJobQualifications: [],
      } as unknown as T;
    } else {
      // Fallback
      return { id: crypto.randomUUID(), title: "" } as unknown as T;
    }
  }

  const [localItem, setLocalItem] = useState<T>(createDefaultItem());

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setLocalItem({ ...localItem, [name]: value });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalItems((prev) => [...prev, localItem]);
    setLocalItem(createDefaultItem());
  }

  function completeAndMoveOn() {
    setItemsStep("editing");
  }

  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>Add Details</h3>
      <div className={styles.detailedListEditorContent}>
        <Sidebar
          currentIndex={0}
          setCurrentIndex={() => {}}
          items={localItems}
          titleText={itemType + "s"}
        />
        <div>
          <h3>Additional {itemType}s</h3>
          <p>
            If you have any other {itemType}s to add, you can include them here.
          </p>
          <Form item={localItem} onChange={onChange} onSubmit={onSubmit} />
          <button onClick={completeAndMoveOn}>Done adding {itemType}s</button>
        </div>
      </div>
    </div>
  );
}
