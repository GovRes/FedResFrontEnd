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
  console.log("completeSteps", steps, stepId);

  await updateApplication({
    id: applicationId,
    input: {
      completedSteps: steps
        .filter((step: StepsType) => step.completed)
        .map((step: StepsType) => step.id),
    },
  });
  return steps.map((step: StepsType) =>
    step.id === stepId ? { ...step, completed: true } : step
  );
}
