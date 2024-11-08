import { FormEvent, useEffect, useState } from "react";
import styles from "./ally.module.css";
import BaseForm from "../forms/BaseForm";
import { Text, Email } from "../forms/Inputs";
import { delayAllyChat } from "../../utils/allyChat";
export default function TempRegister({
  email,
  name,
  setEmail,
  setName,
  setStep,
}: {
  email: string | undefined;
  name: string | undefined;
  setEmail: (email: string) => void;
  setName: (name: string) => void;
  setStep: (step: number) => void;
}) {
  const [registrationStep, setRegistrationStep] = useState(0);
  async function onSubmitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setName(
      (event.currentTarget.elements.namedItem("name") as HTMLInputElement).value
    );
    setRegistrationStep(1);
  }
  async function onSubmitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmail(
      (event.currentTarget.elements.namedItem("email") as HTMLInputElement)
        .value
    );
    setStep(1);
  }
  let allyStatements = [
    "Hi! I'm Ally. Nice to meet you.",
    "Building a federal resume is a detailed process. We’ll be going through your work, job by job, to lay out in your resume why you are a great candidate.",
    "The process will take at least a couple of hours, but you can save your application and come back to it if you need to.",
    "The most important work experience you need to emphasize is the most recent (within the last 10 years) and the most relevant. If you have very applicable experience outside 10 years, consider including it.",
    "To start, can you please tell me your name?",
  ];
  let { allyFormattedGraphs, delay } = delayAllyChat({ allyStatements });
  return (
    <>
      {registrationStep === 0 && !name && (
        <>
          <div className={`${styles.allyChatContainer}`}>
            {allyFormattedGraphs}
          </div>
          <div
            className={`${styles.userChatContainer} ${styles.fade}`}
            style={{ animationDelay: `${delay}s` }}
          >
            <BaseForm onSubmit={onSubmitName}>
              <Text name="name" />
            </BaseForm>
          </div>
        </>
      )}
      {(registrationStep === 1 || name) && !email && (
        <>
          <div className={styles.allyChatContainer}>
            <p className={styles.fade}>
              I also need your email address so I can let you know how things
              are going.
            </p>
          </div>
          <div
            className={`${styles.userChatContainer} ${styles.fade}`}
            style={{ animationDelay: `1s` }}
          >
            <BaseForm onSubmit={onSubmitEmail}>
              <Email name="email" />
            </BaseForm>
          </div>
        </>
      )}
    </>
  );
}