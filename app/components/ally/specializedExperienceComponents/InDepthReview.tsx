import { AllyContext } from "@/app/providers";
import { useContext } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  assistantInstructions,
  assistantName,
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

  if (specializedExperiences && specializedExperiences.length > 0) {
    return (
      <>
        <DetailedListEditor
          assistantInstructions={assistantInstructions}
          assistantName={assistantName}
          heading={job?.title}
          items={specializedExperiences}
          jobString={`${job?.title} at the ${job?.department}`}
          setFunction={setSpecializedExperiences}
          setNext={() => setStep("resume")}
          sidebarTitleText="Specialized Experiences"
        />
      </>
    );
  }
}
