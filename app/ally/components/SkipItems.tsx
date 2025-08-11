"use client";
import Link from "next/link";
import { useApplication } from "@/app/providers/applicationContext";
import { navigateToNextIncompleteStep } from "@/lib/utils/nextStepNavigation";
import { pascalToDashed, pascalToSpaced } from "@/lib/utils/stringBuilders";
import { useRouter } from "next/navigation";

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
