import {useContext, } from "react";
import styles from "./ally.module.css";
import { TopicalQualificationsEditor } from "./careerCoachSteps/TopicalQualificationsEditor";
import { delayAllyChat } from "@/app/utils/allyChat";
import { TopicType } from "@/app/utils/responseSchemas";
import { AllyContext, AllyContextType } from "@/app/providers";
export default function EditTopicalQualifications({
  currentTopic, 
  currentTopicIndex, 
  setCurrentTopic, 
  setCurrentTopicIndex
}: {
  currentTopic?: TopicType, 
  currentTopicIndex: number, 
  setCurrentTopic: Function,
  setCurrentTopicIndex: Function 
}) {
  const { recommendation, topics } = useContext(AllyContext) as AllyContextType;
  let allyStatements = [
    "Great, thanks. We'll talk about that later.",
    "Now, we are going to go through your qualifications one at a time. Can you tell me more about them?",
  ];
  if (recommendation === "Do not recommend") {
    allyStatements.unshift(
      "Our reviewer does not recommend that you apply for this job. We'll deal with this in a later version.")
  }
  const { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        {allyFormattedGraphs}
        {topics && topics.length > 0 && (

          <ul
            className={`${styles.fade}`}
            style={{ animationDelay: `${delay}s` }}
          >
            {topics?.map((topic: TopicType, index) => (
              <li
                key={topic?.id || index}
                className={
                  index === currentTopicIndex ? `${styles.active}` : ""
                }
              >
                {topic?.name}: {topic?.keywords.join(", ")}
              </li>
            ))}
          </ul>
        )}
        {topics && currentTopicIndex + 1 <= topics.length && (
          <>
            <TopicalQualificationsEditor currentTopic={currentTopic} currentTopicIndex={currentTopicIndex} setCurrentTopic={setCurrentTopic} setCurrentTopicIndex={setCurrentTopicIndex} />
          </>
        )}

      </div>
    </div>
  );}