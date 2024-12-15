import { FormEvent, useContext, useEffect, useState } from "react";
import styles from "./ally.module.css";
import BaseForm from "../forms/BaseForm";
import { SubmitButton, TextArea, Url } from "../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";

export default function UsaJobs({
  email,
  jobDescription,
  name,
  resume,
  step,
  url,
  setJobDescription,
  setStep,
  setUrl,
}: {
  email: string | undefined;

  jobDescription: string | undefined;
  name: string | undefined;
  resume: string | undefined;
  step: number;
  url: string | undefined;
  setJobDescription: (jobDescription: string) => void;
  setStep: (step: number) => void;
  setUrl: (url: string) => void;
}) {
  async function onSubmitUsaJobsUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUrl(
      (event.currentTarget.elements.namedItem("usa-jobs") as HTMLInputElement)
        .value
    );
  }
  
  async function onSubmitUsaJobsDescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setJobDescription(
      (
        event.currentTarget.elements.namedItem(
          "job-description"
        ) as HTMLInputElement
      ).value
    );
    setStep(3)
  }

  let allyStatements = [
    "While we work on getting the ability to talk directly to USAJOBS, here's a temporary solution. Can you paste your job description here? (instructions about how)",
  ];

  let { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>{allyFormattedGraphs}</div>
      <div
        className={`${styles.userChatContainer} ${styles.fade}`}
        style={{ animationDelay: `${delay}s` }}
      >
        <BaseForm onSubmit={onSubmitUsaJobsDescription}>
          <TextArea name="job-description" />
          <SubmitButton type="submit">Submit</SubmitButton>
        </BaseForm>
      </div>
    </div>
  );
}
