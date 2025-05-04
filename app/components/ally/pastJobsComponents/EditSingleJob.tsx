import { AllyContext, useAlly } from "@/app/providers";
import { useContext } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
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
  // nextStep,
  PastJob,
  PastJobsLength,
  setCurrentJobIndex,
  savePastJob,
}: {
  currentJobIndex: number;
  localPastJobs: PastJobType[];
  // nextStep: StepType;
  PastJob: PastJobType;
  PastJobsLength: number;
  setCurrentJobIndex: (index: number) => void;
  savePastJob: (PastJob: PastJobType) => void;
}) {
  const { setStep, setPastJobs } = useAlly();
  const { job } = useApplication();

  console.log({ currentJobIndex, localPastJobs, PastJob, PastJobsLength });
  function savePastJobQualification(
    updatedPastJobQualifications:
      | PastJobQualificationType[]
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
      // Check if it's PastJobQualificationType[] before assigning
      if (
        updatedPastJobQualifications.length > 0 &&
        "topic" in updatedPastJobQualifications[0]
      ) {
        let tempPastJob = {
          ...PastJob,
          PastJobQualifications:
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
  function setNextJob() {
    if (currentJobIndex + 1 < PastJobsLength) {
      setCurrentJobIndex(currentJobIndex + 1);
    } else {
      setPastJobs(localPastJobs);
      // setStep(nextStep);
    }
  }

  // Otherwise display the qualifications
  return (
    <DetailedListEditor
      assistantInstructions={pastJobsAssistantInstructions}
      assistantName={pastJobsAssistantName}
      heading={`${PastJob?.title} - Applicable Work Experience`}
      items={PastJob.pastJobQualifications}
      jobString={`${job?.title} at the ${job?.department}`}
      setFunction={savePastJobQualification}
      setNext={setNextJob}
      sidebarTitleText="Job Experience"
    />
  );
}
