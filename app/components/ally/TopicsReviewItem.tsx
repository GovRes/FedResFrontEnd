import { useContext } from "react";
import styles from "./ally.module.css";
import { TopicType } from "@/app/utils/responseSchemas";
import { AllyContext, AllyContextType } from "@/app/providers";

export default function TopicsMapItem({
  index,
  setCurrentTopicIndex,
  topic
}: {
  index: number,
  setCurrentTopicIndex: Function,
  topic: TopicType
}) {
  const {setStep} = useContext(AllyContext) as AllyContextType;
  function changeTopic({ index }: { index: number }) {
    setStep("edit_met_qualifications");
    setCurrentTopicIndex(index);
  }
  console.log({topic})
  return (
   <div 
key={topic.id}
  onClick={changeTopic.bind(null, {index})}
className={
 `${styles.qualificationEditorMapItem}`
}
>
{topic.name}: {topic.evidence}
</div>
  );
}

