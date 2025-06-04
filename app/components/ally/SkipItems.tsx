"use client";
import { useApplication } from "@/app/providers/applicationContext";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import { completeSteps } from "@/app/utils/stepUpdater";
import { pascalToDashed, pascalToSpaced } from "@/app/utils/stringBuilders";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SkipItems({
  currentStepId,
  itemType,
}: {
  currentStepId: string;
  itemType:
    | "Award"
    | "Education"
    | "SpecializedExperience"
    | "PastJob"
    | "VolunteerExperience"
    | "Resume";
}) {
  const { steps, applicationId, setSteps } = useApplication();
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  async function skipItems() {
    const updatedSteps = await completeSteps({
      steps,
      stepId: currentStepId,
      applicationId,
    });
    setSteps(updatedSteps);
    navigateToNextIncompleteStep(currentStepId);
  }

  return (
    <div>
      <div>You don't have any {pascalToSpaced(itemType)}s.</div>
      <Link href={`/profile/${pascalToDashed(itemType)}s`}>
        <button>
          Add {pascalToSpaced(itemType)}s and then come back here to continue
        </button>
      </Link>
      <button onClick={skipItems}>Skip {pascalToSpaced(itemType)}s</button>
    </div>
  );
}
