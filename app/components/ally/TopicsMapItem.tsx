import styles from "./ally.module.css";
import { TopicType } from "@/app/utils/responseSchemas";

export default function TopicsMapItem({
  active, 
  index, 
  setCurrentTopicIndex, 
  topic
}: {
  active: boolean, 
  index: number, 
  setCurrentTopicIndex: Function, 
  topic: TopicType
}) {
  return (
   <div 
key={topic.id}
  onClick={setCurrentTopicIndex.bind(null, index)}
className={
 `${styles.qualificationEditorMapItem} ${active ? `${styles.active}` : ""}`
}
>
{topic?.name} {active ? <ul>{topic.keywords.map((kw) => <li key={kw}>{kw}</li>)}</ul> : <></>}
</div>
  );
}

