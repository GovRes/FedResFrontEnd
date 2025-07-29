"use client";
import { useLoading } from "@/app/providers/loadingContext";
import { useRouter } from "next/navigation";
export default function JobNotFound({
  setSearchSent,
  setQuestionnaireFound,
  setJobResult,
}: {
  setSearchSent: React.Dispatch<React.SetStateAction<boolean>>;
  setQuestionnaireFound: React.Dispatch<React.SetStateAction<boolean>>;
  setJobResult: React.Dispatch<React.SetStateAction<any | null>>;
}) {
  const { setIsLoading } = useLoading();
  const router = useRouter();
  return (
    <div>
      <div>
        This job is not available via USA jobs API. You can try using our search
        function, or pasting a different job URL
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
        onClick={() => {
          setIsLoading(true);
          router.push("/ally/job-search/");
        }}
      >
        Try search.
      </button>
    </div>
  );
}
