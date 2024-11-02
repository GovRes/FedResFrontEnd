import { FormEvent, useState } from "react";
import BaseForm from "../forms/BaseForm";
import { SubmitButton, TextArea, Url } from "../forms/Inputs";
export default function UsaJobs({
  jobDescription,
  name,
  url,
  setJobDescription,
  setStep,
  setUrl,
}: {
  jobDescription: string | undefined;
  name: string | undefined;
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
    setStep(2);
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
    setStep(2);
  }

  return (
    <div>
      <p>
        {name && <>{name},</>} Can you tell me the url of the USAJOBS posting
        we're working on today?
      </p>
      <p>WHAT GOES HERE IS MAYBE AN EXPLAINER ON HOW TO FIND THAT?</p>
      <BaseForm onSubmit={onSubmitUsaJobsUrl}>
        <Url name="usa-jobs" />
      </BaseForm>
      <h2>Temporary USA Job Description:</h2>
      <p>
        While we work on getting the ability to talk directly to USAJOBS, here's
        a temporary solution. Can you paste your job description here?
        (instructions about how)
      </p>
      <BaseForm onSubmit={onSubmitUsaJobsDescription}>
        <TextArea name="job-description" />
        <SubmitButton type="submit">Submit</SubmitButton>
      </BaseForm>
    </div>
  );
}
