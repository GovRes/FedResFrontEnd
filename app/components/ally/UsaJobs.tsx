import { FormEvent, useContext, useEffect, useState } from "react";
import styles from "./ally.module.css";
import BaseForm from "../forms/BaseForm";
import { SubmitButton, TextArea, Url } from "../forms/Inputs";
import { delayAllyChat } from "@/app/utils/allyChat";
import { ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam } from "openai/resources/index.mjs";
import { jobDescriptionReviewerPrompt } from "../../prompts/jobDescriptionReviewer";
import { sendMessages } from "@/app/utils/api";
import { AllyContext, AllyContextType } from "@/app/providers";

export default function UsaJobs() {


  const {setJobDescription} = useContext(AllyContext) as AllyContextType;
  async function onSubmitUsaJobsDescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const jobDescription = (
      event.currentTarget.elements.namedItem(
        "job-description"
      ) as HTMLInputElement
    ).value
    setJobDescription(
      jobDescription
    );
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

/*
async function onSubmitUsaJobsUrl(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setUrl(
    (event.currentTarget.elements.namedItem("usa-jobs") as HTMLInputElement)
    .value
  );
}
*/