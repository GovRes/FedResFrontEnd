"use client";
import { useApplication } from "@/app/providers/applicationContext";

import { navigateToNextIncompleteStep } from "@/app/utils/nextStepNavigation";
import { pascalToDashed, pascalToSpaced } from "@/app/utils/stringBuilders";
import NavigationLink from "@/app/components/loader/NavigationLink";

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

  const router = useRouter();
  const { applicationId, completeStep, steps } = useApplication();
  async function skipItems() {
    navigateToNextIncompleteStep({
      steps,
      router,
      currentStepId,
      applicationId,
      completeStep,
    });

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
