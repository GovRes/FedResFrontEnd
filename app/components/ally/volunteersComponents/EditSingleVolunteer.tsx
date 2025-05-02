import { AllyContext, useAlly } from "@/app/providers";
import { useContext } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  volunteersAssistantName,
  volunteersAssistantInstructions,
} from "@/app/prompts/volunteersWriterPrompt";
import {
  StepType,
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";

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
  localVolunteers: UserJobType[];
  nextStep: StepType;
  volunteer: UserJobType;
  volunteersLength: number;
  setCurrentVolunteerIndex: (index: number) => void;
  saveVolunteer: (userVolunteer: UserJobType) => void;
}) {
  const { job, setStep, setVolunteers } = useAlly();

  console.log({
    currentVolunteerIndex,
    localVolunteers,
    volunteer,
    volunteersLength,
  });
  function saveVolunteerQualification(
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
      // Check if it's UserVolunteerQualificationType[] before assigning
      if (
        updatedUserJobQualifications.length > 0 &&
        "topic" in updatedUserJobQualifications[0]
      ) {
        let tempVolunteer = {
          ...volunteer,
          userJobQualifications:
            updatedUserJobQualifications as UserJobQualificationType[],
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
      items={volunteer.userJobQualifications}
      jobString={`${job?.title} at the ${job?.department}`}
      setFunction={saveVolunteerQualification}
      setNext={setNextVolunteer}
      sidebarTitleText="Volunteer Experience"
    />
  );
}
