import { AllyContext, AllyContextType } from "@/app/providers";
import styles from "./ally.module.css";

import { delayAllyChat } from "@/app/utils/allyChat";
import { TopicType } from "@/app/utils/responseSchemas";
import { useContext } from "react";
import TopicsMapItem from "./TopicsMapItem";
import TopicsReviewItem from "./TopicsReviewItem";
export default function QualificationsFinalReview({
  setCurrentTopicIndex,
}: {
  setCurrentTopicIndex: Function;
}) {
  let allyStatements = [
    "Thank you for all your feedback!",
  ];
  // if (recommendation === "Do not recommend") {
  //   allyStatements.push(
  //     "Our reviewer does not recommend that you apply for this job. We'll deal with this in a later version.")
  // } 
  //   else {
  //       allyStatements.push("Our reviewer thinks you are a great candidate for this job!")
  //   }
  const {topics, setStep} = useContext(AllyContext) as AllyContextType;
  const { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });

  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        {allyFormattedGraphs}
        <p>Here are my descriptions of your qualifications and evidence to support them. To make any changes, just click on the one you would like to work on.:</p>
        <ul
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay}s` }}
        >
          {topics?.map((topic: TopicType, index) => (
            <TopicsReviewItem
              index={index}
              key={topic.id}
              setCurrentTopicIndex={setCurrentTopicIndex}
              topic={topic} />
          ))}
        </ul>
        {/* <p>And here are the ones we think are a stretch for you:</p>
        <ul
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay}s` }}
        >
          {unmetQualifications.map((qualification: QualificationType, index) => (
            <li
              key={qualification.id}
              
            >
              <strong>{qualification.name}</strong> - {qualification.description}
            </li>
          ))}
        </ul> */}
      </div>
      
    </div>
  );
}
