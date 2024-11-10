import { FormEvent, useEffect, useState } from "react";
import styles from "../ally.module.css";
import BaseForm from "../../forms/BaseForm";
import { TextArea, SubmitButton } from "../../forms/Inputs";
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
    "Great, thanks. We'll talk about that later.",
    "Now, we are going to go through your qualifications one at a time. Can you tell me more about them?",
  ];
  const { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  const [currentQualification, setCurrentQualification] = useState(0);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let response = event.currentTarget.qualificationResponse.value;
    if (response) {
      setQualificationFeedback({
        qualification: metQualifications[currentQualification],
        feedback: response,
      });
      event.currentTarget.qualificationResponse.value = "";
    } else {
      setCurrentQualification(currentQualification + 1);
    }
  };
  useEffect(() => {
    if (currentQualification === metQualifications.length) {
      setCareerCoachStep(3);
    }
  }, [currentQualification]);
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        {allyFormattedGraphs}
        <ul
          className={`${styles.fade}`}
          style={{ animationDelay: `${delay}s` }}
        >
          {metQualifications.map((qualification: Qualification, index) => (
            <li
              key={qualification.id}
              className={
                index === currentQualification ? `${styles.active}` : ""
              }
            >
              {qualification.name}
            </li>
          ))}
        </ul>
      </div>
      {currentQualification + 1 <= metQualifications.length && (
        <>
          {metQualifications[currentQualification].description ? (
            <>
              <div
                className={`${styles.allyChatContainer} ${styles.fade}`}
                style={{ animationDelay: `${delay + 0.5}s` }}
              >
                <p
                  className={styles.fade}
                  style={{ animationDelay: `${delay + 0.5}s` }}
                >
                  Here's the description I wrote about your qualifications in{" "}
                  {metQualifications[currentQualification].name}
                </p>
                <p
                  className={styles.fade}
                  style={{ animationDelay: `${delay + 1}s` }}
                >
                  <i>{metQualifications[currentQualification].description}</i>
                </p>
                <p
                  className={styles.fade}
                  style={{ animationDelay: `${delay + 1.5}s` }}
                >
                  If that sounds good to you, click "Next" to move on.
                  Otherwise, tell me what you'd like to change about this.
                </p>
              </div>
            </>
          ) : (
            <>
              <div
                className={`${styles.allyChatContainer} ${styles.fade}`}
                style={{ animationDelay: `${delay + 0.5}s` }}
              >
                <p
                  className={styles.fade}
                  style={{ animationDelay: `${delay + 0.5}s` }}
                >
                  Can you tell me more about your experiences with{" "}
                  {metQualifications[currentQualification].name}?
                </p>
              </div>
            </>
          )}

          <div
            className={`${styles.userChatContainer} ${styles.fade}`}
            style={{ animationDelay: `${delay + 1.6}s` }}
          >
            <BaseForm onSubmit={onSubmit}>
              <TextArea name="qualificationResponse" />
              <SubmitButton type="submit">Next</SubmitButton>
            </BaseForm>
          </div>
        </>
      )}
    </div>
  );
}
// tk separate out the qualification feedback from the "next" button so that on submit increments the index of the qualification
