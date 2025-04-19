import {
  AwardType,
  SpecializedExperienceType,
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import styles from "../../ally.module.css";
import SidebarItem from "./SidebarItem";

export default function Sidebar({
  currentIndex,
  items,
  setCurrentIndex,
  titleText,
}: {
  currentIndex: number;
  items:
    | SpecializedExperienceType[]
    | AwardType[]
    | UserJobType[]
    | UserJobQualificationType[];
  setCurrentIndex: Function;
  titleText: string;
}) {
  const itemsList = items.map((item, index) => (
    <SidebarItem
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
