import { FormEvent, useState } from "react";
import styles from "./ally.module.css";
import Uploader from "../forms/Uploader";
import BaseForm from "../forms/BaseForm";
import { TextArea, SubmitButton } from "../forms/Inputs";
export default function Resume({
  name,
  setResume,
  setStep,
}: {
  name: string | undefined;
  setResume: (resume: string) => void;
  setStep: (step: number) => void;
}) {
  async function onSubmitResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResume(
      (event.currentTarget.elements.namedItem("resume") as HTMLInputElement)
        .value
    );
    setStep(2);
  }
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
        <p className={styles.fade}>
          While we work on getting the ability to directly upload resumes,
          please copy and paste your resume here. Don't worry about formatting.
        </p>
      </div>
      <div
        className={`${styles.userChatContainer} ${styles.fade}`}
        style={{ animationDelay: `1s` }}
      >
        <BaseForm onSubmit={onSubmitResume}>
          <TextArea name="resume" />
          <SubmitButton type="submit">Submit</SubmitButton>
        </BaseForm>
      </div>
    </div>
  );
}
