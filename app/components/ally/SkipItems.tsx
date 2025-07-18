"use client";
import { useApplication } from "@/app/providers/applicationContext";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import { pascalToDashed, pascalToSpaced } from "@/app/utils/stringBuilders";
import Link from "next/link";

export default function SkipItems({
  currentStepId,
  itemType,
}: {
  currentStepId: string;
  itemType:
    | "Award"
    | "Education"
    | "PastJob"
    | "VolunteerExperience"
    | "Resume";
}) {
  const { completeStep } = useApplication();
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  async function skipItems() {
    await completeStep(currentStepId);
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
