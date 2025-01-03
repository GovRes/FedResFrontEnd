import { FormEvent, Ref, RefObject, useState } from "react";
import styles from "./ally.module.css";
import { QualificationsType, QualificationType } from "@/app/utils/responseSchemas";
import BaseForm from "../forms/BaseForm";
import { Checkboxes, TextArea, SubmitButton } from "../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { getCheckboxValues } from "@/app/utils/formUtils";
import { StepType } from "@/app/providers";
export default function WrongMetToUnmet({
  qualifications,
  recommendation,
  setQualifications,
  setReviewedMetQualifications,
}: {
  qualifications: QualificationsType;
  recommendation: string;
  setQualifications: (qualifications: QualificationsType) => void;
  setReviewedMetQualifications: (reviewedMetQualifications: boolean) => void;
}) {
  console.log(qualifications)
  let allyStatements = [
    `Our reviewer ${recommendation === "Do not recommend" ? "does not recommend" : "recommends"} that you apply for this job. We'll deal with this in a later version.`,
    "I've reviewed your resume and job description. Here are some of the qualifications you meet.",
  ];
  let { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = getCheckboxValues(event);
    setReviewedMetQualifications(true);
    let objs: QualificationType[] = values
      .map((value) => {
        let item = qualifications.metQualifications.find((obj) => obj.id === value);
        if (item) {
          let index = qualifications.metQualifications.indexOf(item);
          let updatedMetQualifications = qualifications.metQualifications.filter((_, i) => i !== index)
          setQualifications({...qualifications, metQualifications: updatedMetQualifications});
        }
        return item;
      })
      .filter((obj): obj is QualificationType => obj !== undefined);
    if (objs.length > 0) {
      let updatedUnmetQualifications = [...qualifications.unmetQualifications, ...objs]
      setQualifications({...qualifications, unmetQualifications: updatedUnmetQualifications});
    }
  };
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        {allyFormattedGraphs}
        <ul
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay}s` }}
        >
          {qualifications.metQualifications.map((qualification: QualificationType) => (
            <li key={qualification.id}>{qualification.name}</li>
          ))}
        </ul>
        <p
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay + 0.5}s` }}
        >
          I'm going to ask you a little bit about each of these to see if you
          can expand on your experience.
        </p>
        <p
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay + 1}s` }}
        >
          First of all, could you please check any qualifications that you don't
          think you actually meet?
        </p>
      </div>
      <div
        className={`${styles.userChatContainer} ${styles.fade}`}
        style={{ animationDelay: `${delay + 1.5}s` }}
      >
        <BaseForm onSubmit={onSubmit}>
          <Checkboxes
            additionalClassName="negative"
            options={qualifications.metQualifications}
          />
          <SubmitButton type="submit">Submit</SubmitButton>
        </BaseForm>
      </div>
    </div>
  );
}
