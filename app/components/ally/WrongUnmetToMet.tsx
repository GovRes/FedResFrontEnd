import { FormEvent, Ref, RefObject, useState } from "react";
import styles from "./ally.module.css";
import {
  QualificationsType,
  QualificationType,
} from "@/app/utils/responseSchemas";
import BaseForm from "../forms/BaseForm";
import { Checkboxes, TextArea, SubmitButton } from "../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { getCheckboxValues } from "@/app/utils/formUtils";
export default function WrongUnmetToMet({
  qualifications,
  setQualifications,
  setReviewedUnmetQualifications,
}: {
  qualifications: QualificationsType;
  setQualifications: (qualifications: QualificationsType) => void;
  setReviewedUnmetQualifications: (
    reviewedUnmetQualifications: boolean
  ) => void;
}) {
  let allyStatements = [
    "I've reviewed your resume and job description. Here are some of the qualifications you don't seem to meet.",
  ];
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.scrollTo(0, 0);
    const values = getCheckboxValues(event);
    setReviewedUnmetQualifications(true);
    let objs: QualificationType[] = values
      .map((value) => {
        let item = qualifications.unmetQualifications.find(
          (obj) => obj.id === value
        );
        if (item) {
          let index = qualifications.unmetQualifications.indexOf(item);
          let updatedUnmetQualifications =
            qualifications.unmetQualifications.filter((_, i) => i !== index);
          setQualifications({
            ...qualifications,
            unmetQualifications: updatedUnmetQualifications,
          });
        }
        return item;
      })
      .filter((obj): obj is QualificationType => obj !== undefined);
    if (objs.length > 0) {
      let updatedMetQualifications = [
        ...qualifications.metQualifications,
        ...objs,
      ];
      setQualifications({
        ...qualifications,
        unmetQualifications: updatedMetQualifications,
      });
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
          {qualifications.unmetQualifications.map(
            (qualification: QualificationType) => (
              <li key={qualification.id}>{qualification.name}</li>
            )
          )}
        </ul>
        <p
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay + 0.5}s` }}
        >
          Could you please check any qualifications that you think you actually
          meet?
        </p>
      </div>
      <div
        className={`${styles.userChatContainer} ${styles.fade}`}
        style={{ animationDelay: `${delay + 1}s` }}
      >
        <BaseForm onSubmit={onSubmit}>
          <Checkboxes
            additionalClassName="positive"
            options={qualifications.unmetQualifications}
          />
          <SubmitButton type="submit">Submit</SubmitButton>
        </BaseForm>
      </div>
    </div>
  );
}
