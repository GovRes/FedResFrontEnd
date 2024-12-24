import { FormEvent, useEffect, useState } from "react";
import styles from "../ally.module.css";
import BaseForm from "../../forms/BaseForm";
import { TextArea, SubmitButton } from "../../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { QualificationType } from "@/app/utils/responseSchemas";
import { CareerCoachStepType

 } from "../CareerCoach";
import { MetQualificationsEditor } from "./MetQualificationsEditor";
export default function EditMetQualifications({
  metQualifications,
  recommendation,
  setCareerCoachStep,
}: {
  metQualifications: QualificationType[];
  recommendation: string;
  setCareerCoachStep: (step: CareerCoachStepType) => void;
}) {
  let allyStatements = [
    "Great, thanks. We'll talk about that later.",
    "Now, we are going to go through your qualifications one at a time. Can you tell me more about them?",
  ];
  if (recommendation === "Do not recommend") {
    allyStatements.unshift(
      "Our reviewer does not recommend that you apply for this job. We'll deal with this in a later version.")
  }
  const { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  const [currentQualificationIndex, setCurrentQualificationIndex] = useState(0);

  useEffect(() => {
    if (currentQualificationIndex === metQualifications.length) {
      setCareerCoachStep("make_changes_to_met_qualifications");
    }
  }, [currentQualificationIndex]);
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        {allyFormattedGraphs}
        <ul
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay}s` }}
        >
          {metQualifications.map((qualification: QualificationType, index) => (
            <li
              key={qualification.id}
              className={
                index === currentQualificationIndex ? `${styles.active}` : ""
              }
            >
              {qualification.name}
            </li>
          ))}
        </ul>
      </div>
      {currentQualificationIndex + 1 <= metQualifications.length && (
        <MetQualificationsEditor currentQualification={metQualifications[currentQualificationIndex]} currentQualificationIndex={currentQualificationIndex} setCurrentQualificationIndex={setCurrentQualificationIndex}/>
      )}
    </div>
  );
}
// tk separate out the qualification feedback from the "next" button so that on submit increments the index of the qualification
