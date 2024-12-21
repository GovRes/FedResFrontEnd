import { FormEvent, useState } from "react";
import styles from "../ally.module.css";
import { QualificationType } from "@/app/utils/responseSchemas";
import BaseForm from "../../forms/BaseForm";
import { Checkboxes, TextArea, SubmitButton } from "../../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { getCheckboxValues } from "@/app/utils/formUtils";
import { CareerCoachStepType } from "../CareerCoach";
export default function WrongUnmetToMet({
  metQualifications,
  setCareerCoachStep,
  unmetQualifications,
  setMetQualifications,
  setReviewedUnmetQualifications,
  setUnmetQualifications,
}: {
  metQualifications: QualificationType[];
  unmetQualifications: QualificationType[];
  setCareerCoachStep: (step: CareerCoachStepType) => void;
  setMetQualifications: (metQualifications: QualificationType[]) => void;
  setReviewedUnmetQualifications: (reviewedUnmetQualifications: boolean) => void;
  setUnmetQualifications: (unmetQualifications: QualificationType[]) => void;
}) {
  let allyStatements = [
    "I've reviewed your resume and job description. Here are some of the qualifications you don't seem to meet.",
  ];
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = getCheckboxValues(event);
    setReviewedUnmetQualifications(true);
    setCareerCoachStep("edit_met_qualifications");
    let objs: QualificationType[] = values
      .map((value) => {
        let item = unmetQualifications.find(
          (obj) => obj.id === value
        );
        if (item) {
          let index = unmetQualifications.indexOf(item);
          setUnmetQualifications(
            unmetQualifications.filter((_, i) => i !== index)
          );
        }
        return item;
      })
      .filter((obj): obj is QualificationType=> obj !== undefined);
    if (objs.length > 0) {
      setMetQualifications([...metQualifications, ...objs]);
    }
  };
  let { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        {allyFormattedGraphs}
        <ul
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay}s` }}
        >
          {unmetQualifications.map((qualification: QualificationType) => (
            <li key={qualification.id}>{qualification.name}</li>
          ))}
        </ul>
        <p
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay + 0.5}s` }}
        >
          Could you please check any qualifications that you think
          you actually meet?
        </p>
      </div>
      <div
        className={`${styles.userChatContainer} ${styles.fade}`}
        style={{ animationDelay: `${delay + 1}s` }}
      >
        <BaseForm onSubmit={onSubmit}>
          <Checkboxes
            additionalClassName="positive"
            options={unmetQualifications}
          />
          <SubmitButton type="submit">Submit</SubmitButton>
        </BaseForm>
      </div>
    </div>
  );
}
