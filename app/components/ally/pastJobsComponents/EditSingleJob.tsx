import { AllyContext, useAlly } from "@/app/providers";
import { useContext } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/DetailedListEditor";
import {
  pastJobsAssistantName,
  pastJobsAssistantInstructions,
} from "@/app/prompts/pastJobsWriterPrompt";
import {
  StepType,
  PastJobQualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { useApplication } from "@/app/providers/applicationContext";

export default function EditSingleJob({
  currentJobIndex,
  localPastJobs,
  navigateToNextUnconfirmedJob,
  pastJob,
  pastJobsLength,
  setCurrentJobIndex,
  savePastJob,
}: {
  currentJobIndex: number;
  localPastJobs: PastJobType[];
  navigateToNextUnconfirmedJob: (job: PastJobType) => void;
  pastJob: PastJobType;
  pastJobsLength: number;
  setCurrentJobIndex: (index: number) => void;
  savePastJob: (PastJob: PastJobType) => void;
}) {
  const { job } = useApplication();

  function savePastJobQualification(
    updatedPastJobQualifications: PastJobQualificationType[]
  ) {
    try {
      if (
        updatedPastJobQualifications.length > 0 &&
        "topic" in updatedPastJobQualifications[0]
      ) {
        let tempPastJob = {
          ...pastJob,
          pastJobQualifications:
            updatedPastJobQualifications as PastJobQualificationType[],
        };
        savePastJob(tempPastJob);
      } else {
        console.error("Received incompatible qualification type");
      }
    } catch (error) {
      console.error("Error in savePastJobQualification:", error);
    }
  }
  // Otherwise display the qualifications
  return (
    <DetailedListEditor
      assistantInstructions={pastJobsAssistantInstructions}
      assistantName={pastJobsAssistantName}
      heading={`${pastJob?.title} - Applicable Work Experience`}
      items={pastJob.pastJobQualifications}
      jobString={`${job?.title} at the ${job?.department}`}
      setFunction={savePastJobQualification}
      setNext={navigateToNextUnconfirmedJob}
      sidebarTitleText="Job Experience"
    />
  );
}
