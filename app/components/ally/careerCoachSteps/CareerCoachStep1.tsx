import { FormEvent, useState } from "react";
import styles from "../ally.module.css";
import { Qualification } from "../AllyContainer";
import BaseForm from "../../forms/BaseForm";
import { Checkboxes, TextArea, SubmitButton } from "../../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { getCheckboxValues } from "@/app/utils/formUtils";
export default function CareerCoachStep0({
  metQualifications,
  setCareerCoachStep,
  unmetQualifications,
  setMetQualifications,
  setUnmetQualifications,
}: {
  metQualifications: Qualification[];
  unmetQualifications: Qualification[];
  setCareerCoachStep: (step: number) => void;
  setMetQualifications: (metQualifications: Qualification[]) => void;
  setUnmetQualifications: (unmetQualifications: Qualification[]) => void;
}) {
  let allyStatements = [
    "I've reviewed your resume and job description. Here are some of the qualifications you don't seem to meet.",
  ];
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = getCheckboxValues(event);
    setCareerCoachStep(2);
    let objs: Qualification[] = values
      .map((value) => {
        let item = unmetQualifications.find(
          (obj) => obj.id === parseInt(value)
        );
        if (item) {
          let index = unmetQualifications.indexOf(item);
          setUnmetQualifications(
            unmetQualifications.filter((_, i) => i !== index)
          );
        }
        return item;
      })
      .filter((obj): obj is Qualification => obj !== undefined);
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
          {unmetQualifications.map((qualification: Qualification) => (
            <li key={qualification.id}>{qualification.name}</li>
          ))}
        </ul>
        <p
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay + 0.5}s` }}
        >
          First of all, could you please check any qualifications that you think
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
