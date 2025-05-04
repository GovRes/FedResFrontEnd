"use client";
import { useContext } from "react";
import DetailedListEditor from "../sharedComponents/DetailedListEditor/Container";
import {
  specializedExperienceAssistantInstructions,
  specializedExperienceAssistantName,
} from "@/app/prompts/specializedExperienceWriterPrompt";
import { SpecializedExperienceContext } from "@/app/providers/specializedExperienceContext";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import { createAndSaveSpecializedExperiences } from "@/app/crud/specializedExperience";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { completeSteps } from "@/app/utils/stepUpdater";
import { useApplication } from "@/app/providers/applicationContext";
import { useAlly } from "@/app/providers";
export default function InDepthReview() {
  const router = useRouter();
  const { specializedExperiences, setSpecializedExperiences } = useContext(
    SpecializedExperienceContext
  );
  const { user } = useAuthenticator();
  const { job } = useApplication();
  const { steps, applicationId, setSteps } = useApplication();
  async function saveSpecializedExperiences({
    specializedExperiences,
    applicationId,
    userId,
  }: {
    specializedExperiences: SpecializedExperienceType[];
    applicationId: string;
    userId: string;
  }) {
    await createAndSaveSpecializedExperiences({
      specializedExperiences,
      applicationId,
      userId,
    });
    return;
  }
  async function setNext() {
    saveSpecializedExperiences({
      specializedExperiences,
      applicationId,
      userId: user.userId,
    });
    const updatedSteps = await completeSteps({
      steps,
      stepId: "specialized-experiences",
      applicationId,
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
