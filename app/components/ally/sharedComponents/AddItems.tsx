import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { JSX, useState } from "react";
import SidebarItem from "../sharedComponents/DetailedListEditor/SidebarItem";
import Sidebar from "../sharedComponents/DetailedListEditor/Sidebar";
import styles from "../ally.module.css";

export default function AddItems<
  T extends AwardType | EducationType | PastJobType
>({
  baseItem,
  Form,
  header,
  itemType,
  localItems,
  setGlobalItems,
  setLocalItems,
  setNext,
}: {
  baseItem: T;
  Form: React.ComponentType<{
    item: T;
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }>;
  header: string;
  itemType: string;
  setGlobalItems: (value: T[]) => void;
  localItems: T[];
  setLocalItems: React.Dispatch<React.SetStateAction<T[]>>;
  setNext: Function;
}) {
  const [localItem, setLocalItem] = useState<T>(baseItem);

  let itemsList: JSX.Element[] = [];

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setLocalItem({ ...localItem, [name]: value });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalItems((prev) => [...prev, localItem]);
    setLocalItem(baseItem);
  }

  function completeAndMoveOn() {
    console.log("completeAndMoveOn called");
    console.log("localItems:", localItems);
    setGlobalItems(localItems);
    console.log("Global items set, calling setNext()");
    setNext();
  }

  if (localItems && localItems.length > 0) {
    itemsList = localItems.map((item: T, index) => {
      return (
        <SidebarItem
          currentIndex={0}
          index={index}
          key={item.id}
          setCurrentIndex={() => {}}
          item={item}
        />
      );
    });
  }

  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>{header}</h3>
      <div className={styles.detailedListEditorContent}>
        {/* Use the generic Sidebar */}
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
            if you want
          </p>
          <Form item={localItem} onChange={onChange} onSubmit={onSubmit} />
          <button onClick={completeAndMoveOn}>Done adding {itemType}s</button>
        </div>
      </div>
    </div>
  );
}
