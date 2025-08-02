// utils/nextStepNavigation.ts
import { StepsType } from "./responseSchemas";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Finds the next incomplete step after the current step
 * @param steps - The array of all steps
 * @param currentStepId - The ID of the current step
 * @returns The next incomplete step or undefined if there are no more incomplete steps
 */
export const findNextIncompleteStep = (
  steps: StepsType[],
  currentStepId: string
): StepsType | undefined => {
  // Find the index of the current step
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  if (currentIndex === -1) {
    console.error(`Current step '${currentStepId}' not found in steps array`);
    return undefined;
  }

  // Look for the next incomplete step after the current one
  for (let i = currentIndex + 1; i < steps.length; i++) {
    if (!steps[i].completed) {
      return steps[i];
    }
  }

  // If no incomplete step found after current step, look from the beginning
  // This creates a circular navigation if needed
  for (let i = 0; i < currentIndex; i++) {
    if (!steps[i].completed) {
      return steps[i];
    }
  }

  // If all steps are completed, return undefined
  return steps.pop();
};

export const navigateToNextIncompleteStep = async ({
  applicationId,
  steps,
  router,
  currentStepId,
  completeStep,
}: {
  applicationId: string;
  steps: StepsType[];
  router: AppRouterInstance;
  currentStepId: string;
  completeStep: (stepId: string, applicationId?: string) => Promise<void>;
}): Promise<boolean> => {
  await completeStep(currentStepId, applicationId);
  const nextStep = findNextIncompleteStep(steps, currentStepId);
  if (nextStep) {
    router.push(`/ally${nextStep.path}`);
    return true; // indicates navigation occurred
  }
  return false; // indicates no navigation (all steps complete)
};
