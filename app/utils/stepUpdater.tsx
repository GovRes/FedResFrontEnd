import { StepsType } from "./responseSchemas";

export function completeSteps({
  steps,
  stepId,
}: {
  steps: StepsType[];
  stepId: string;
}) {
  return steps.map((step: StepsType) =>
    step.id === stepId ? { ...step, completed: true } : step
  );
}
