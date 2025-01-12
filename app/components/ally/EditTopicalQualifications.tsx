import {JSX, JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useContext, } from "react";
import styles from "./ally.module.css";
import TopicsMapItem from "./TopicsMapItem";
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
  let topicsList: JSX.Element[] = [];
  if (topics && topics.length > 0) {
    topicsList = topics.map((topic: TopicType, index) => {
      return <TopicsMapItem active={index === currentTopicIndex} index={index} key={topic.id}  setCurrentTopicIndex={setCurrentTopicIndex} topic={topic} />;
    })
  }
  return (
    <div className={`${styles.qualificationEditorContainer}`}>
      <div className={`${styles.qualificationEditorMap}`}>
        <h2>Qualifications</h2>
        {topicsList}
      </div>
      <div className={`${styles.allyChatContainer} ${styles.qualificationEditorAllyChat}`}>
        {allyFormattedGraphs}
        {topics && currentTopicIndex + 1 <= topics.length && (
          <>
            <TopicalQualificationsEditor currentTopic={currentTopic} currentTopicIndex={currentTopicIndex} setCurrentTopic={setCurrentTopic} setCurrentTopicIndex={setCurrentTopicIndex} />
          </>
        )}

      </div>
    </div>
  );}