import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import styles from "../../ally.module.css";
import DetailedListEditorSidebarItem from "./SidebarItem";

export default function DetailedListEditorSidebar({
  currentIndex,
  items,
  setCurrentIndex,
  titleText,
}: {
  currentIndex: number;
  items: SpecializedExperienceType[];
  setCurrentIndex: Function;
  titleText: string;
}) {
  const itemsList = items.map((item, index) => (
    <DetailedListEditorSidebarItem
      currentIndex={currentIndex}
      key={item.id}
      index={index}
      item={item}
      setCurrentIndex={setCurrentIndex}
    />
  ));
  return (
    <div className={`${styles.qualificationEditorMap}`}>
      <h2>{titleText}</h2>
      {itemsList}
    </div>
  );
}
