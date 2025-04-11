import { AllyContext } from "@/app/providers";
import { useContext, useState } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  specializedExperienceAssistantInstructions,
  specializedExperienceAssistantName,
} from "@/app/prompts/specializedExperienceWriterPrompt";
import { spec } from "node:test/reporters";
export default function InDepthReview() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { setStep } = context;
  const { job } = context;
  const { specializedExperiences, setSpecializedExperiences } = context;

  if (specializedExperiences && specializedExperiences.length > 0) {
    let otherExperiences = specializedExperiences.filter(
      (ex) =>
        ex.typeOfExperience === "experience" || ex.typeOfExperience === "other"
    );
    return (
      <>
        <DetailedListEditor
          assistantInstructions={specializedExperienceAssistantInstructions}
          assistantName={specializedExperienceAssistantName}
          heading={job?.title}
          items={otherExperiences}
          jobString={`${job?.title} at the ${job?.department}`}
          setFunction={(newOtherExperiences) => {
            const updatedExperiences = [
              ...newOtherExperiences,
            ] as typeof specializedExperiences;
            setSpecializedExperiences(updatedExperiences);
          }}
          setNext={() => setStep("resume")}
          sidebarTitleText="Specialized Experiences"
        />
      </>
    );
  }
}
// }
