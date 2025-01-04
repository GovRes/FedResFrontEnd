import styles from "./ally.module.css";

import { delayAllyChat } from "@/app/utils/allyChat";
import { TopicType } from "@/app/utils/responseSchemas";
export default function QualificationsFinalReview({
  topics
}: {
  topics: TopicType[] | undefined;
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
  
  const { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
 
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        {allyFormattedGraphs}
        <p>Here are my descriptions of your qualifications and evidence to support them:</p>
        <ul
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay}s` }}
        >
          {topics?.map((topic: TopicType) => (
            <li
              key={topic.id}
              
            >
              <strong>{topic.name}</strong> - {topic.evidence}
            </li>
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
// tk separate out the qualification feedback from the "next" button so that on submit increments the index of the qualification
