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
import { useUserResume } from "@/app/providers/userResumeContext";
import { useAlly } from "@/app/providers";
export default function InDepthReview() {
  const router = useRouter();
  const { specializedExperiences, setSpecializedExperiences } = useContext(
    SpecializedExperienceContext
  );
  const { user } = useAuthenticator();
  const { job } = useAlly();
  const { steps, userResumeId, setSteps } = useUserResume();
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
  async function setNext() {
    saveSpecializedExperiences({
      specializedExperiences,
      userResumeId,
      userId: user.userId,
    });
    const updatedSteps = await completeSteps({
      steps,
      stepId: "specialized-experiences",
      userResumeId,
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
