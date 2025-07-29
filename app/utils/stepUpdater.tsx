import { StepsType } from "./responseSchemas";
import { updateApplication } from "../crud/application";
export async function completeSteps({
  steps,
  stepId,
  applicationId,
}: {
  steps: StepsType[];
  stepId: string;
  applicationId: string;
}) {
  const updatedSteps = steps.map((step: StepsType) =>
    step.id === stepId ? { ...step, completed: true } : step
  );
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
