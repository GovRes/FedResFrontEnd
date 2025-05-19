import {
  AwardType,
  EducationType,
  QualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import styles from "../ally.module.css";
import { useEffect, useState } from "react";

export default function EditItem<
  T extends AwardType | EducationType | PastJobType | QualificationType
>({
  currentIndex,
  Form,
  item,
  itemType,
  itemsLength,
  removeItem,
  saveItem,
  setCurrentIndex,
  setNext,
}: {
  currentIndex: number;
  Form: React.ComponentType<{
    item: T;
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  }>;
  item: T;
  itemType: string;
  itemsLength: number;
  removeItem: (id: string) => void;
  saveItem: (item: T) => void;
  setCurrentIndex: (index: number) => void;
  setNext: Function;
}) {
  const [localItem, setLocalItem] = useState<T>(item);
  const onChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLocalItem({ ...localItem, [name]: value });
  };
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveItem(localItem);
    window.scroll(0, 0);
    if (currentIndex !== itemsLength - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      setNext("additional");
    }
  };

  const deleteItem = () => {
    removeItem(localItem.id);
    window.scroll(0, 0);
    if (currentIndex !== itemsLength - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
      setNext("additional");
    }
  };

  useEffect(() => {
    setLocalItem(item);
  }, [item]);
  return (
    <div>
      <h2>Editing {item.title}</h2>
      <div className={styles.allyChatContainer}>
        Here are the {itemType}s we extracted from your resume. Please make any
        necessary corrections and fill in missing information.
      </div>
      <div className={`${styles.userChatContainer} ${styles.fade}`}>
        <Form item={localItem} onSubmit={onSubmit} onChange={onChange} />
      </div>
      <button onClick={deleteItem}>
        This {itemType} is not real or not relevant
      </button>
    </div>
  );
}
