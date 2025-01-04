import { FormEvent, useContext } from "react";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource'; // Path to your backend resource definition
import styles from "./ally.module.css";
import BaseForm from "../forms/BaseForm";
import { SubmitButton, TextArea } from "../forms/Inputs";
import {Uploader} from "../forms/Uploader";
import { AllyContext, AllyContextType } from "@/app/providers";

// const client = generateClient<Schema>();

export default function Resume() {
   const {setResume, setStep} = useContext(AllyContext) as AllyContextType;
  function onSubmitResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    setResume( (
      event.currentTarget.elements.namedItem(
        "resume"
      ) as HTMLInputElement
    ).value);
    setStep("usa_jobs")
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


/*
async function onSubmitResume({fileName}: {fileName: string}) {
    const { errors, data: newResume } = await client.models.Resume.create(
      {
        fileName,
      },
      {
        authMode: 'userPool',
      }
    );
    if (errors) {
      console.error(errors);
      return;
    }
    if (newResume){
      const resumeId = newResume.id;
      setResume(resumeId);
    }
    setStep(2);
  }
  return (
    <div>
      <div className={`${styles.allyChatContainer}`}>
         <p className={styles.fade}>
           Please upload your resume. It needs to be in PDF format.
         </p>
       </div>
       <Uploader onSuccess={onSubmitResume} />
      </div>
  )
*/
