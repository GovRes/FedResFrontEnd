import styles from "../../ally.module.css";
import {
  SpecializedExperienceType,
  TopicType,
} from "@/app/utils/responseSchemas";

export default function DetailedListEditorItem({
  currentIndex,
  index,
  setCurrentIndex,
  item,
}: {
  currentIndex: number;
  index: number;
  setCurrentIndex: Function;
  item: SpecializedExperienceType | TopicType;
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

  let headingText;
  if ("title" in item) {
    headingText = item.title;
  } else if ("name" in item) {
    headingText = item.name;
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
