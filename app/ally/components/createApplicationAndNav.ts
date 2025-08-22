import createApplication from "@/lib/utils/createApplication";
import { navigateToNextIncompleteStep } from "@/lib/utils/nextStepNavigation";

export default async function createApplicationAndNavigate({
  jobId,
  userId,
  setLoading,
  steps,
  setApplicationId,
  completeStep,
  router,
}: {
  jobId: string;
  userId: string;
  setLoading: (loading: boolean) => void;
  steps: any; // Use your actual type
  setApplicationId: (id: string) => void;
  completeStep: (stepId: string, applicationId?: string) => Promise<void>;
  router: any; // Use your actual router type
}) {
  const newApplicationId = await createApplication({
    completeStep,
    jobId,
    userId,
    setLoading: setLoading,
    setApplicationId,
  });
  console.log("New application created with ID:", newApplicationId);

  if (newApplicationId) {
    console.log("Navigating to next step");
    setTimeout(() => {
      navigateToNextIncompleteStep({
        steps,
        router,
        currentStepId: "usa-jobs",
        applicationId: newApplicationId,
        completeStep,
      });
    }, 100);
  }
}
