// useApplicationStep.tsx
import { useEffect } from "react";
import { useApplication } from "@/app/providers/applicationContext";

/**
 * A hook to help manage step completion status in the application context.
 *
 * @param stepId - The ID of the step to manage
 * @param shouldBeComplete - If provided, ensures the step has this completion status
 * @param dependencyArray - Additional dependencies to trigger the effect
 * @returns Object with the current completion status of the step
 */
export function useApplicationStep(
  stepId: string,
  shouldBeComplete?: boolean,
  dependencyArray: any[] = []
) {
  const { steps, setSteps } = useApplication();

  // Find the current step
  const currentStep = steps.find((s) => s.id === stepId);
  const isStepComplete = currentStep?.completed || false;

  // This effect manages step completion status
  useEffect(() => {
    // Only run if shouldBeComplete is explicitly defined (not undefined)
    if (shouldBeComplete === undefined) return;

    // Find the step
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return;

    const step = steps[stepIndex];

    // If the step's completion status doesn't match what it should be
    if (step.completed !== shouldBeComplete) {
      // Create a new array with the updated step
      const updatedSteps = [...steps];
      updatedSteps[stepIndex] = {
        ...step,
        completed: shouldBeComplete,
      };

      // Update the steps in context
      setSteps(updatedSteps);
    }
  }, [stepId, shouldBeComplete, steps, setSteps, ...dependencyArray]);

  return {
    isStepComplete,
    // Additional utility function to manually toggle step completion
    toggleStepCompletion: () => {
      const stepIndex = steps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return;

      const step = steps[stepIndex];
      const updatedSteps = [...steps];
      updatedSteps[stepIndex] = {
        ...step,
        completed: !step.completed,
      };

      setSteps(updatedSteps);
    },
  };
}

/**
 * Specifically for the past job details step.
 *
 * @param areAllQualificationsConfirmed - Whether all qualifications are confirmed
 * @param isEditMode - Whether we're in edit mode, in which case don't change completion status
 * @returns Object with the current completion status of the step
 */
export function usePastJobDetailsStep(
  areAllQualificationsConfirmed?: boolean,
  isEditMode?: boolean
) {
  // If in edit mode, pass undefined so the step's completion status isn't changed
  const shouldBeComplete = isEditMode
    ? undefined
    : areAllQualificationsConfirmed;

  return useApplicationStep("past-job-details", shouldBeComplete, [
    areAllQualificationsConfirmed,
    isEditMode,
  ]);
}
