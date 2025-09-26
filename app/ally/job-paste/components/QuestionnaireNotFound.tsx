"use client";
import { useApplication } from "@/app/providers/applicationContext";
import createApplicationAndNavigate from "../../components/createApplicationAndNav";
import { useRouter } from "next/navigation";
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
  const { steps, setApplicationId, completeStep } = useApplication();
  const router = useRouter();
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
          if (jobResult && jobResult.jobId) {
            await createApplicationAndNavigate({
              jobId: jobResult.jobId,
              userId,
              setLoading,
              steps,
              setApplicationId,
              completeStep,
              router,
            });
          }
        }}
      >
        Go forward with less information
      </button>
    </div>
  );
}
