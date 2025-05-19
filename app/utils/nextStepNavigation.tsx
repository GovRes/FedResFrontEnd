// utils/nextStepNavigation.ts
import { useRouter } from "next/navigation";
import { useApplication } from "../providers/applicationContext";
import { StepsType } from "../utils/responseSchemas";

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
  console.log(16, steps);
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

/**
 * Hook to navigate to the next incomplete step
 * @returns Functions to navigate to the next step
 */
export function useNextStepNavigation() {
  const { steps } = useApplication();
  const router = useRouter();

  /**
   * Navigates to the next incomplete step
   * @param currentStepId - The ID of the current step
   * @returns True if navigation was successful, false otherwise
   */
  const navigateToNextIncompleteStep = (currentStepId: string): boolean => {
    const nextStep = findNextIncompleteStep(steps, currentStepId);
    console.log(59, nextStep);
    if (nextStep) {
      router.push(`/ally${nextStep.path}`);
      return true;
    } else {
      console.log("All steps are completed or no valid next step found");

      // Optional: Navigate to a completion page or the first step
      // router.push("/ally/completion");
      return false;
    }
  };

  /**
   * Gets the path to the next incomplete step without navigating
   * @param currentStepId - The ID of the current step
   * @returns The path to the next incomplete step or undefined
   */
  const getNextIncompletePath = (currentStepId: string): string | undefined => {
    console.log(77, currentStepId);
    const nextStep = findNextIncompleteStep(steps, currentStepId);
    return nextStep ? `/ally${nextStep.path}` : undefined;
  };

  return {
    navigateToNextIncompleteStep,
    findNextIncompleteStep: (currentStepId: string) =>
      findNextIncompleteStep(steps, currentStepId),
    getNextIncompletePath,
  };
}
