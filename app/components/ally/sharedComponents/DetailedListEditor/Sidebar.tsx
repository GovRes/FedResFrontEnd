import {
  AwardType,
  EducationType,
  SpecializedExperienceType,
  TopicType,
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import styles from "../../ally.module.css";
import SidebarItem from "./SidebarItem";
export default function Sidebar<
  T extends
    | AwardType
    | EducationType
    | SpecializedExperienceType
    | UserJobType
    | UserJobQualificationType
>({
  currentIndex,
  items,
  setCurrentIndex,
  titleText,
}: {
  currentIndex: number;
  items: T[];
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
