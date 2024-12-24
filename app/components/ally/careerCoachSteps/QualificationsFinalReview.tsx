import { FormEvent, useEffect, useState } from "react";
import styles from "../ally.module.css";
import BaseForm from "../../forms/BaseForm";
import { TextArea, SubmitButton } from "../../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { QualificationType } from "@/app/utils/responseSchemas";
import { CareerCoachStepType

 } from "../CareerCoach";
export default function QualificationsFinalReview({
  metQualifications,
  recommendation,
  unmetQualifications,
}: {
  metQualifications: QualificationType[];
  recommendation: string;
  unmetQualifications: QualificationType[];
}) {
  let allyStatements = [
    "Thank you for all your feedback!",
    // "Now, we are going to go through your qualifications one at a time. Can you tell me more about them?",
  ];
  if (recommendation === "Do not recommend") {
    allyStatements.push(
      "Our reviewer does not recommend that you apply for this job. We'll deal with this in a later version.")
  } 
    else {
        allyStatements.push("Our reviewer thinks you are a great candidate for this job!")
    }
  
  const { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
 
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        {allyFormattedGraphs}
        <p>Here are the qualifications we think you meet:</p>
        <ul
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay}s` }}
        >
          {metQualifications.map((qualification: QualificationType, index) => (
            <li
              key={qualification.id}
              
            >
              <strong>{qualification.name}</strong> - {qualification.description}
            </li>
          ))}
        </ul>
        <p>And here are the ones we think are a stretch for you:</p>
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
        </ul>
      </div>
      
    </div>
  );
}
// tk separate out the qualification feedback from the "next" button so that on submit increments the index of the qualification
