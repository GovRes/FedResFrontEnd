import { FormEvent, useEffect, useState } from "react";
import styles from "../ally.module.css";
import BaseForm from "../../forms/BaseForm";
import { RadioSelect, TextArea, SubmitButton } from "../../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { Qualification } from "../AllyContainer";
export default function CareerCoachStep1({
  metQualifications,
  setCareerCoachStep,
  setQualificationFeedback,
}: {
  metQualifications: Qualification[];
  setQualificationFeedback: ({
    qualification,
    feedback,
  }: {
    qualification: Qualification;
    feedback: string;
  }) => void;
  setCareerCoachStep: (step: number) => void;
}) {
  const allyStatements = [
    "Here's what I've got for your qualifications. Would you like to make any changes at all?",
  ];
  const { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  const [currentQualification, setCurrentQualification] =
    useState<Qualification | null>(null);
  const [currentQualificationId, setCurrentQualificationId] = useState<
    number | null
  >(null);
  const [makeChanges, setMakeChanges] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let response = event.currentTarget.qualificationResponse.value;
    if (response && currentQualification) {
      setQualificationFeedback({
        qualification: currentQualification,
        feedback: response,
      });
      event.currentTarget.qualificationResponse.value = "";
      setCurrentQualification(null);
      setCurrentQualificationId(null);
      setMakeChanges(false);
    }
  };
  const onSubmitQualification = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let response = event.currentTarget.qualification.value;
    console.log(response);
    if (response) {
      console.log(response);
      setCurrentQualificationId(parseInt(response));
      setCurrentQualification(
        metQualifications.find((q) => q.id === parseInt(response)) || null
      );
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
          {metQualifications.map((qualification: Qualification, index) => (
            <li key={qualification.id}>
              {qualification.name} - {qualification.description}
            </li>
          ))}
        </ul>
      </div>
      {!currentQualificationId ? (
        <div
          className={`${styles.userChatContainer} ${styles.fade}`}
          style={{ animationDelay: `${delay + 1.6}s` }}
        >
          <button
            className={styles.positive}
            onClick={() => setCareerCoachStep(4)}
          >
            Looks good
          </button>
          <button
            className={styles.negative}
            onClick={() => setMakeChanges(true)}
          >
            I actually have some changes to make
          </button>
          {makeChanges && (
            <>
              <p>I'd like to change this:</p>
              <BaseForm onSubmit={onSubmitQualification}>
                <RadioSelect
                  additionalClassName="negative"
                  name="qualification"
                  options={metQualifications}
                />
                <SubmitButton type="submit">Submit</SubmitButton>
              </BaseForm>
            </>
          )}
        </div>
      ) : (
        <div
          className={`${styles.userChatContainer} ${styles.fade}`}
          style={{ animationDelay: `${delay + 1.6}s` }}
        >
          <p>Here are my changes on {currentQualification?.name}</p>
          <BaseForm onSubmit={onSubmit}>
            <TextArea name="qualificationResponse" />
            <SubmitButton type="submit">Next</SubmitButton>
          </BaseForm>
        </div>
      )}
    </div>
  );
}
