"use client";
import { AllyContext } from "@/app/providers";
import { useContext } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  specializedExperienceAssistantInstructions,
  specializedExperienceAssistantName,
} from "@/app/prompts/specializedExperienceWriterPrompt";
import { SpecializedExperienceContext } from "@/app/providers/providers";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import { createAndSaveSpecializedExperiences } from "@/app/crud/specializedExperience";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { completeSteps } from "@/app/utils/stepUpdater";
export default function InDepthReview() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const router = useRouter();
  const { specializedExperiences, setSpecializedExperiences } = useContext(
    SpecializedExperienceContext
  );
  const { user } = useAuthenticator();
  const { job, steps, userResumeId, setSteps } = context;
  async function saveSpecializedExperiences({
    specializedExperiences,
    userResumeId,
    userId,
  }: {
    specializedExperiences: SpecializedExperienceType[];
    userResumeId: string;
    userId: string;
  }) {
    await createAndSaveSpecializedExperiences({
      specializedExperiences,
      userResumeId,
      userId,
    });
    return;
  }
  function setNext() {
    saveSpecializedExperiences({
      specializedExperiences,
      userResumeId,
      userId: user.userId,
    });
    const updatedSteps = completeSteps({
      steps,
      stepId: "specialized_experiences",
    });
    setSteps(updatedSteps);
    router.push("/ally/past_jobs");
  }
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
          setNext={setNext}
          sidebarTitleText="Specialized Experiences"
        />
      </>
    );
  }
}
// }
