import { AllyContext, useAlly } from "@/app/providers";
import { useContext } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/DetailedListEditor";
import {
  volunteersAssistantName,
  volunteersAssistantInstructions,
} from "@/app/prompts/volunteersWriterPrompt";
import {
  StepType,
  PastJobQualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { useApplication } from "@/app/providers/applicationContext";

export default function EditSingleVolunteer({
  currentVolunteerIndex,
  localVolunteers,
  nextStep,
  volunteer,
  volunteersLength,
  setCurrentVolunteerIndex,
  saveVolunteer,
}: {
  currentVolunteerIndex: number;
  localVolunteers: PastJobType[];
  nextStep: StepType;
  volunteer: PastJobType;
  volunteersLength: number;
  setCurrentVolunteerIndex: (index: number) => void;
  saveVolunteer: (userVolunteer: PastJobType) => void;
}) {
  const { setStep, setVolunteers } = useAlly();
  const { job } = useApplication();

  function saveVolunteerQualification(
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
      // Check if it's UserVolunteerQualificationType[] before assigning
      if (
        updatedPastJobQualifications.length > 0 &&
        "topic" in updatedPastJobQualifications[0]
      ) {
        let tempVolunteer = {
          ...volunteer,
          PastJobQualifications:
            updatedPastJobQualifications as PastJobQualificationType[],
        };
        saveVolunteer(tempVolunteer);
      } else {
        console.error("Received incompatible qualification type");
      }
    } catch (error) {
      console.error("Error in saveUserVolunteerQualification:", error);
    }
  }
  function setNextVolunteer() {
    if (currentVolunteerIndex + 1 < volunteersLength) {
      setCurrentVolunteerIndex(currentVolunteerIndex + 1);
    } else {
      setVolunteers(localVolunteers);
      setStep(nextStep);
    }
  }

  // Otherwise display the qualifications
  return (
    <DetailedListEditor
      assistantInstructions={volunteersAssistantInstructions}
      assistantName={volunteersAssistantName}
      heading={`${volunteer?.title} - Applicable Volunteer or Community Service Experience`}
      items={volunteer.pastJobQualifications}
      jobString={`${job?.title} at the ${job?.department}`}
      setFunction={saveVolunteerQualification}
      setNext={setNextVolunteer}
      sidebarTitleText="Volunteer Experience"
    />
  );
}
