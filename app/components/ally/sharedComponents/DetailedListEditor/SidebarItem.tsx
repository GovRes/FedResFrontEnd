import {
  AwardType,
  EducationType,
  SpecializedExperienceType,
  TopicType,
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import styles from "../../ally.module.css";
import { generateHeadingText } from "@/app/utils/stringBuilders";

export default function SidebarItem<
  T extends
    | AwardType
    | EducationType
    | UserJobType
    | UserJobQualificationType
    | SpecializedExperienceType
>({
  currentIndex,
  index,
  item,
  setCurrentIndex,
}: {
  currentIndex: number;
  index: number;
  item: T;
  setCurrentIndex: Function;
}) {
  let content;
  if ("keywords" in item && Array.isArray(item.keywords)) {
    content = (
      <ul>
        {item.keywords.map((kw) => (
          <li key={kw}>{kw}</li>
        ))}
      </ul>
    );
  } else if ("description" in item) {
    content = <div>{item.description}</div>;
  }
  let headingText = generateHeadingText(item);
  return (
    <div
      key={item.id}
      onClick={setCurrentIndex.bind(null, index)}
      className={`${styles.qualificationEditorMapItem} ${
        index === currentIndex ? `${styles.active}` : ""
      }`}
    >
      <div className={styles.qualificationEditorMapItemHeader}>
        {headingText}
      </div>
      {index === currentIndex && content ? content : <></>}
    </div>
  );
}
