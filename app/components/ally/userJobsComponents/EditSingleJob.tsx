import { AllyContext, useAlly } from "@/app/providers";
import { useContext } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  userJobsAssistantName,
  userJobsAssistantInstructions,
} from "@/app/prompts/userJobsWriterPrompt";
import {
  StepType,
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";

export default function EditSingleJob({
  currentJobIndex,
  localUserJobs,
  // nextStep,
  userJob,
  userJobsLength,
  setCurrentJobIndex,
  saveUserJob,
}: {
  currentJobIndex: number;
  localUserJobs: UserJobType[];
  // nextStep: StepType;
  userJob: UserJobType;
  userJobsLength: number;
  setCurrentJobIndex: (index: number) => void;
  saveUserJob: (userJob: UserJobType) => void;
}) {
  const { job, setStep, setUserJobs } = useAlly();

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
      setUserJobs(localUserJobs);
      setStep(nextStep);
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
