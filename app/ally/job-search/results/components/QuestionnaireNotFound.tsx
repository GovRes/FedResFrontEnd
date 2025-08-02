"use client";
import { useApplication } from "@/app/providers/applicationContext";

import { navigateToNextIncompleteStep } from "@/lib/utils/nextStepNavigation";
import { useRouter } from "next/navigation";
import createApplication from "@/lib/utils/createApplication";
export default function questionnaireNotFound({
  jobId,
  returnToSearch,
  userId,
  setLoading,
}: {
  jobId: string;
  returnToSearch: () => void;
  userId: string;
  setLoading: (loading: boolean) => void;
}) {
  const router = useRouter();
  console.log(jobId);
  const { completeStep, steps, setApplicationId } = useApplication();
  async function makeApplication() {
    if (jobId) {
      const result = await createApplication({
        completeStep,
        jobId,
        userId: userId,
        setLoading: setLoading,
        setApplicationId,
      });
      if (result) {
        navigateToNextIncompleteStep({
          steps,
          router,
          currentStepId: "usa-jobs",
          applicationId: result.id,
          completeStep: completeStep,
        });
      } else {
        console.error("Failed to create application:", result?.error);
      }
    }
  }
  return (
    <div>
      <div>
        We could not find a questionnaire for this job. Please try another job
        URL. We will eventually have an interface that will allow you to paste
        the questionnaire. In the meantime, you can either move forward based
        only on the job information we were able to retrieve, or return to
        search.
      </div>
      <button onClick={returnToSearch}>Back to search</button>
      <button onClick={makeApplication}>
        Go forward with less information
      </button>
    </div>
  );
}
