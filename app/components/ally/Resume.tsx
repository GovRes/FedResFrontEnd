import { FormEvent, useState } from "react";
import BaseForm from "../forms/BaseForm";
import { Text } from "../forms/Inputs";
export default function Resume({
  name,
  setName,
  setStep,
}: {
  name: string | undefined;
  setName: (name: string) => void;
  setStep: (step: number) => void;
}) {
  async function onSubmitResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // setEmail(
    //   (event.currentTarget.elements.namedItem("email") as HTMLInputElement)
    //     .value
    // );
    setStep(2);
  }

  return (
    <div>
      <p>
        {name && <>Great to meet you, {name}.</>} Let's start by uploading your
        resumes. You can upload up to five resumes. In the future, we'll even
        let you select ones that you had uploaded in the past.{" "}
      </p>
      <p>
        TK RESUME UPLOADER THING LIKE THIS:
        https://dev.to/aws-builders/how-to-upload-files-to-amazon-s3-with-react-and-aws-sdk-b0n
        AND THEN SEND THE URL TO THE BACKEND OR Do we just want the user to
        paste the job description?
      </p>
    </div>
  );
}

// Obj shape for back end
//         {
//           email: {email},
//           step: {step} || 1,
//           usalJobsUrl: {usalJobsUrl},
//         }
