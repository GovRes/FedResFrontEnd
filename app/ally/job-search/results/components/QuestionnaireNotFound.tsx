"use client";
import createApplicationAndNavigate from "@/app/ally/components/createApplicationAndNav";
import { useApplication } from "@/app/providers/applicationContext";
import { useRouter } from "next/navigation";
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
  console.log(jobId);
  const { steps, setApplicationId, completeStep } = useApplication();
  const router = useRouter();
  async function makeApplication() {
    if (jobId) {
      await createApplicationAndNavigate({
        jobId,
        userId,
        setLoading,
        steps,
        setApplicationId,
        completeStep,
        router,
      });
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
