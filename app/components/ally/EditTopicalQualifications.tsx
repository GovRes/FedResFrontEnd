import {isEqual} from 'lodash';
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import styles from "./ally.module.css";
import BaseForm from "../forms/BaseForm";
import { TextArea, SubmitButton } from "../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { QualificationType, TopicsType, TopicType } from "@/app/utils/responseSchemas";

import { TopicalQualificationsEditor } from "./careerCoachSteps/TopicalQualificationsEditor";
import { AllyContext, AllyContextType } from "@/app/providers";
import { qualificationsEvidenceWriter } from "../aiProcessing/qualificationsEvidenceWriter";
import { useWhatChanged } from '@simbathesailor/use-what-changed';
export default function EditTopicalQualifications({currentTopic, currentTopicIndex, setCurrentTopicIndex}: {currentTopic: TopicType, currentTopicIndex: number, setCurrentTopicIndex: Function}) {
  const { jobDescription, resume, recommendation, topics } = useContext(AllyContext) as AllyContextType;
  console.log(15, currentTopicIndex)
  let allyStatements = [
    "Great, thanks. We'll talk about that later.",
    "Now, we are going to go through your qualifications one at a time. Can you tell me more about them?",
  ];
  if (recommendation === "Do not recommend") {
    allyStatements.unshift(
      "Our reviewer does not recommend that you apply for this job. We'll deal with this in a later version.")
  }
  const { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  const stableTopics = useMemo(() => topics, [topics]);
const stableJobDescription = useMemo(() => jobDescription, [jobDescription]);
const stableResume = useMemo(() => resume, [resume]);
useEffect(() => {
  console.log('EditTopicalQualifications mounted');
  return () => console.log('EditTopicalQualifications unmounted');
}, []);

// useEffect(() => {
//   console.log('Dependencies changed:', { currentTopicIndex, jobDescription, resume, topics });
// }, [currentTopicIndex, jobDescription, resume, topics]);

// useEffect(() => {
//   const fetchData = async () => {
//     if (stableJobDescription && stableResume && stableTopics) {
//       await qualificationsEvidenceWriter({
//         currentTopic: stableTopics[currentTopicIndex],
//         jobDescription: stableJobDescription,
//         resume: stableResume,
//         setLoading,
//         setLoadingText,
//       });
//     }
//   };
//   fetchData();
// }, [currentTopicIndex, stableJobDescription, stableResume, stableTopics]);


// useEffect(() => {
//   if (
//     !isEqual(jobDescription, stableJobDescription) ||
//     !isEqual(resume, stableResume) ||
//     !isEqual(topics, stableTopics)
//   ) {
//     console.log('Values changed');
//   }
// }, [jobDescription, resume, topics, stableJobDescription, stableResume, stableTopics]);

  // let deps = [currentTopicIndex,
  //   jobDescription,
  //   resume,
  //   topics,
  //   ]
  // useWhatChanged(deps, 'currentTopicIndex, jobDescription, resume, topics');
  // console.log(recommendation, allyStatements)
  // useEffect(() => {
  //   const fetchData = async () => {
  //     if (jobDescription && resume && topics) {
  //       await qualificationsEvidenceWriter({
  //         currentTopic: topics[currentTopicIndex],
  //         jobDescription,
  //         resume,
  //         setLoading,
  //         setLoadingText
  //       });
  //     }
  //   };
  //   fetchData();
  //   console.log('use effect');
  // }, [
  //   currentTopicIndex,
  //   jobDescription,
  //   resume,
  //   topics,
  // ]);
  // useEffect(() => {
  // if (currentTopicIndex === topics?.length) {
  //   console.log("setting career coach step 32");
  //   setCareerCoachStep("make_changes_to_met_qualifications");
  // }
  //   console.log(currentTopicIndex, topics)
  // }, [currentTopicIndex]);  
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
        <div>Topic</div>
        {topics && currentTopicIndex + 1 <= topics.length && (
          <>
            Topic 1
            <TopicalQualificationsEditor currentTopic={currentTopic} currentTopicIndex={currentTopicIndex} setCurrentTopicIndex={setCurrentTopicIndex} />

          </>
        )}

      </div>
    </div>
  );
}
// tk separate out the qualification feedback from the "next" button so that on submit increments the index of the qualification
