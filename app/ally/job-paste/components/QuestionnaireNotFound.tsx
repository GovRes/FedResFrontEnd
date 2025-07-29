"use client";
import { useApplication } from "@/app/providers/applicationContext";

import { navigateToNextIncompleteStep } from "@/app/utils/nextStepNavigation";
import { useRouter } from "next/navigation";
import createApplication from "@/app/utils/createApplication";
export default function questionnaireNotFound({
  jobResult,
  userId,
  setJobResult,
  setLoading,
  setQuestionnaireFound,
  setSearchSent,
}: {
  jobResult: any;
  userId: string;
  setJobResult: React.Dispatch<React.SetStateAction<any | null>>;
  setLoading: (loading: boolean) => void;
  setQuestionnaireFound: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchSent: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const { completeStep, steps, setApplicationId } = useApplication();
  return (
    <div>
      <div>
        We could not find a questionnaire for this job. Please try another job
        URL. We will eventually have an interface that will allow you to paste
        the questionnaire. In the meantime, you can either move forward based
        only on the job information we were able to retrieve, or return to
        search.
      </div>
      <button
        onClick={() => {
          setSearchSent(false);
          setQuestionnaireFound(false);
          setJobResult(null); // Reset jobResult when going back
        }}
      >
        Back to paste a different job URL
      </button>
      <button
        onClick={async () => {
          // Use jobResult.jobId instead of job.data[0].id
          if (jobResult && jobResult.jobId) {
            console.log("Button clicked, creating application");
            const result = await await createApplication({
              completeStep,
              jobId: jobResult.jobId,
              userId: userId,
              setLoading: setLoading,
              setApplicationId,
            });
            console.log("Create application result:", result);
            if (result?.success) {
              navigateToNextIncompleteStep({
                steps,
                router,
                currentStepId: "usa-jobs",
                applicationId: result.id,
                completeStep: result.completeStep,
              });
            } else {
              console.error("Failed to create application:", result?.error);
            }
          }
        }}
      >
        Go forward with less information
      </button>
    </div>
  );
}
