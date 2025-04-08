import { AllyContext } from "@/app/providers";
import { useContext, useState } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  degreeAssistantInstructions,
  degreeAssistantName,
  specializedExperienceAssistantInstructions,
  specializedExperienceAssistantName,
} from "@/app/prompts/specializedExperienceWriterPrompt";
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
  const [experienceStep, setExperienceStep] = useState("degrees");

  if (specializedExperiences && specializedExperiences.length > 0) {
    let degreeExperiences = specializedExperiences.filter(
      (ex) =>
        ex.typeOfExperience === "certification" ||
        ex.typeOfExperience === "degree" ||
        ex.typeOfExperience === "license"
    );
    let otherExperiences = specializedExperiences.filter(
      (ex) =>
        ex.typeOfExperience === "experience" || ex.typeOfExperience === "other"
    );
    if (experienceStep === "degrees") {
      return (
        //filter only degree and licenses etc
        <>
          <DetailedListEditor
            assistantInstructions={degreeAssistantInstructions}
            assistantName={degreeAssistantName}
            heading={`${job?.title} - Certifications and Degrees`}
            items={degreeExperiences}
            jobString={`${job?.title} at the ${job?.department}`}
            setFunction={(newDegreeExperiences) => {
              // Preserve other experiences while updating degree experiences
              const updatedExperiences = [
                ...newDegreeExperiences,
                ...otherExperiences,
              ];
              setSpecializedExperiences(updatedExperiences);
            }}
            setNext={() => setExperienceStep("other")}
            sidebarTitleText="Specialized Experiences"
          />
        </>
      );
    } else {
      return (
        //filter only experiences and other
        <>
          <DetailedListEditor
            assistantInstructions={specializedExperienceAssistantInstructions}
            assistantName={specializedExperienceAssistantName}
            heading={job?.title}
            items={otherExperiences}
            jobString={`${job?.title} at the ${job?.department}`}
            setFunction={(newOtherExperiences) => {
              // Preserve degree experiences while updating other experiences
              const updatedExperiences = [
                ...degreeExperiences,
                ...newOtherExperiences,
              ];
              setSpecializedExperiences(updatedExperiences);
            }}
            setNext={() => setStep("resume")}
            sidebarTitleText="Specialized Experiences"
          />
        </>
      );
    }
  }
}
