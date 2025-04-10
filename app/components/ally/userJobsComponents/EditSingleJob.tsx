import { AllyContext } from "@/app/providers";
import { useContext, useState } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  userJobsAssistantName,
  userJobsAssistantInstructions,
} from "@/app/prompts/userJobsWriterPrompt";
import { UserJobType } from "@/app/utils/responseSchemas";
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
  const { job, loading, loadingText, setStep, setUserJobs } = context;

  function saveUserJobQualification() {
    try {
      // Default to empty array if userJobQualifications doesn't exist
      const qualifications = userJob.userJobQualifications || [];

      let tempUserJobQualifications = qualifications.map(
        (userJobQualification) => {
          return {
            ...userJobQualification,
            paragraph: userJobQualification.paragraph,
            userConfirmed: true,
          };
        }
      );
      let tempUserJob = {
        ...userJob,
        userJobQualifications: tempUserJobQualifications,
      };
      saveUserJob(tempUserJob);
    } catch (error) {
      console.error("Error in saveUserJobQualification:", error);
    }
  }
  function setNextJob() {
    if (currentJobIndex + 1 < userJobsLength) {
      setCurrentJobIndex(currentJobIndex + 1);
    } else {
      setUserJobs(localUserJobs);
      setStep("pause");
    }
  }

  if (loading) {
    return <TextBlinkLoader text={loadingText} />;
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
      sidebarTitleText="Specialized Experiences"
    />
  );
}
