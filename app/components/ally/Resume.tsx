import { FormEvent, useState } from "react";
import styles from "./ally.module.css";
import {Uploader} from "../forms/Uploader";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource'; // Path to your backend resource definition

const client = generateClient<Schema>();

export default function Resume({
  name,
  setResume,
  setStep,
}: {
  name: string | undefined;
  setResume: (resume: string) => void;
  setStep: (step: number) => void;
}) {
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
//   return (
//     <div>
//       <div className={`${styles.allyChatContainer}`}>
//         <p className={styles.fade}>
//           While we work on getting the ability to directly upload resumes,
//           please copy and paste your resume here. Don't worry about formatting.
//         </p>
//       </div>
//       <div
//         className={`${styles.userChatContainer} ${styles.fade}`}
//         style={{ animationDelay: `1s` }}
//       >
//         <BaseForm onSubmit={onSubmitResume}>
//           <TextArea name="resume" />
//           <SubmitButton type="submit">Submit</SubmitButton>
//         </BaseForm>
//       </div>
//     </div>
//   );
}
