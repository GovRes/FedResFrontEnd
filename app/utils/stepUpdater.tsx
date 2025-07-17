import { StepsType } from "./responseSchemas";
import { updateApplication } from "../crud/application";

// Centralized function to apply disabling logic based on completed steps
export function applyStepDisablingLogic(
  steps: StepsType[],
  currentStepId?: string
): StepsType[] {
  const result = steps.map((step: StepsType) => {
    let shouldBeDisabled: boolean;

    // RULE 1: Completed steps are never disabled
    if (step.completed) {
      shouldBeDisabled = false;
    }
    // RULE 2: Current step is never disabled
    else if (currentStepId && step.id === currentStepId) {
      shouldBeDisabled = false;
    }
    // RULE 3: Always keep usa-jobs and return-resume enabled
    else if (step.id === "usa-jobs" || step.id === "return-resume") {
      shouldBeDisabled = false;
    } else {
      // Check dependencies for each step
      switch (step.id) {
        case "specialized-experience":
        case "extract-keywords":
          const usaJobsCompleted = steps.find(
            (s) => s.id === "usa-jobs"
          )?.completed;
          shouldBeDisabled = !usaJobsCompleted;
          break;

        case "past-jobs":
        case "awards":
        case "education":
        case "volunteer-experiences":
          const specializedExpCompleted = steps.find(
            (s) => s.id === "specialized-experience"
          )?.completed;
          const keywordsCompleted = steps.find(
            (s) => s.id === "extract-keywords"
          )?.completed;
          shouldBeDisabled = !(specializedExpCompleted && keywordsCompleted);
          break;

        case "specialized-experience-details":
          const specializedExpCompletedForDetails = steps.find(
            (s) => s.id === "specialized-experience"
          )?.completed;
          shouldBeDisabled = !specializedExpCompletedForDetails;
          break;

        case "past-job-details":
          const pastJobsCompleted = steps.find(
            (s) => s.id === "past-jobs"
          )?.completed;
          shouldBeDisabled = !pastJobsCompleted;
          break;

        case "volunteer-details":
          const volunteerExpCompleted = steps.find(
            (s) => s.id === "volunteer-experiences"
          )?.completed;
          shouldBeDisabled = !volunteerExpCompleted;
          break;

        default:
          shouldBeDisabled = step.disabled;
          break;
      }
    }

    // Always create new object - simple and guarantees React re-render
    return { ...step, disabled: shouldBeDisabled };
  });
  return result;
}

function clearDisabledSteps(steps: StepsType[], stepId: string) {
  // Mark the step as completed first
  const stepsWithCompletion = steps.map((step: StepsType) =>
    step.id === stepId ? { ...step, completed: true } : step
  );
  // Then apply the disabling logic, passing the current step
  const result = applyStepDisablingLogic(stepsWithCompletion, stepId);
  return result;
}

export async function completeSteps({
  steps,
  stepId,
  applicationId,
}: {
  steps: StepsType[];
  stepId: string;
  applicationId: string;
}) {
  const updatedSteps = clearDisabledSteps(steps, stepId);
  await updateApplication({
    id: applicationId,
    input: {
      completedSteps: updatedSteps
        .filter((step: StepsType) => step.completed)
        .map((step: StepsType) => step.id),
    },
  });
  return updatedSteps;
}
