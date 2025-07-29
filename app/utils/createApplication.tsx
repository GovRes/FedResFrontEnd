import { createAndSaveApplication } from "../crud/application";

export default async function createApplication({
  completeStep,
  jobId,
  userId,
  setLoading,
  setApplicationId,
}: {
  completeStep: (stepId: string, applicationId?: string) => Promise<void>;
  jobId: string;
  userId: string;
  setLoading: (loading: boolean) => void;
  setApplicationId: (id: string) => void;
}) {
  setLoading(true);
  try {
    console.log("Creating application for job:", jobId);
    const applicationRes = await createAndSaveApplication({
      jobId,
      userId,
    });
    console.log("Application created:", applicationRes);

    // Update context state - this will trigger sessionStorage update in the context
    setApplicationId(applicationRes.id);

    // Complete the step
    console.log("marking step complete");
    await completeStep("usa-jobs", applicationRes.id);
    console.log("Application creation completed");

    return applicationRes.id; // Return the ID instead of boolean
  } catch (error) {
    console.error("Error creating application:", error);
    return null;
  } finally {
    setLoading(false);
  }
}
