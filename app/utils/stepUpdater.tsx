import { StepsType } from "./responseSchemas";
import { updateUserResume } from "../crud/userResume";
export async function completeSteps({
  steps,
  stepId,
  userResumeId,
}: {
  steps: StepsType[];
  stepId: string;
  userResumeId: string;
}) {
  console.log("completeSteps", steps, stepId);

  await updateUserResume({
    id: userResumeId,
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
