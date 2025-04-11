import { AllyContext } from "@/app/providers";
import { useContext, useState } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  userJobsAssistantName,
  userJobsAssistantInstructions,
} from "@/app/prompts/userJobsWriterPrompt";
import {
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "../../loader/Loader";

export default function EditSingleJob({
  currentJobIndex,
  localUserJobs,
  userJob,
  userJobsLength,
  setCurrentJobIndex,
  saveUserJob,
}: {
  currentJobIndex: number;
  localUserJobs: UserJobType[];
  userJob: UserJobType;
  userJobsLength: number;
  setCurrentJobIndex: (index: number) => void;
  saveUserJob: (userJob: UserJobType) => void;
}) {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { job, setStep, setUserJobs } = context;

  console.log({ currentJobIndex, localUserJobs, userJob, userJobsLength });
  function saveUserJobQualification(
    updatedUserJobQualifications:
      | UserJobQualificationType[]
      | {
          id: string;
          title: string;
          description: string;
          initialMessage: string;
          typeOfExperience:
            | "degree"
            | "certification"
            | "license"
            | "experience"
            | "other";
          paragraph?: string;
          userConfirmed?: boolean;
        }[]
  ) {
    try {
      // Check if it's UserJobQualificationType[] before assigning
      if (
        updatedUserJobQualifications.length > 0 &&
        "topic" in updatedUserJobQualifications[0]
      ) {
        let tempUserJob = {
          ...userJob,
          userJobQualifications:
            updatedUserJobQualifications as UserJobQualificationType[],
        };
        saveUserJob(tempUserJob);
      } else {
        console.error("Received incompatible qualification type");
      }
    } catch (error) {
      console.error("Error in saveUserJobQualification:", error);
    }
  }
  function setNextJob() {
    if (currentJobIndex + 1 < userJobsLength) {
      setCurrentJobIndex(currentJobIndex + 1);
    } else {
      console.log(localUserJobs);
      setUserJobs(localUserJobs);
      setStep("return_resume");
    }
  }

  // Otherwise display the qualifications
  return (
    <DetailedListEditor
      assistantInstructions={userJobsAssistantInstructions}
      assistantName={userJobsAssistantName}
      heading={`${userJob?.title} - Applicable Work Experience`}
      items={userJob.userJobQualifications}
      jobString={`${job?.title} at the ${job?.department}`}
      setFunction={saveUserJobQualification}
      setNext={setNextJob}
      sidebarTitleText="Job Experience"
    />
  );
}
