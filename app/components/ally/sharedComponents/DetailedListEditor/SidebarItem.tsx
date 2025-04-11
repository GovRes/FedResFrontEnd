import styles from "../../ally.module.css";
import {
  SpecializedExperienceType,
  TopicType,
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";

export default function SidebarItem({
  currentIndex,
  index,
  setCurrentIndex,
  item,
}: {
  currentIndex: number;
  index: number;
  setCurrentIndex: Function;
  item:
    | UserJobType
    | SpecializedExperienceType
    | TopicType
    | UserJobQualificationType;
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
  console.log(item);
  let headingText = "";
  if ("organization" in item && "title" in item) {
    // Properly narrow the type for both organization and name properties
    const typedItem = item as { title: string; organization: string };
    headingText = `${typedItem.title} at ${typedItem.organization}`;
  } else if ("title" in item) {
    headingText = `${item.title}`;
  } else if ("name" in item && typeof (item as any).name === "string") {
    headingText = (item as any).name;
  }
  return (
    <div
      key={item.id}
      onClick={setCurrentIndex.bind(null, index)}
      className={`${styles.qualificationEditorMapItem} ${
        index === currentIndex ? `${styles.active}` : ""
      }`}
    >
      {headingText}
      {index === currentIndex && content ? content : <></>}
    </div>
  );
}
