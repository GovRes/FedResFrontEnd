"use client";
import { useRouter } from "next/navigation";
export default function JobNotFound({
  resetSearch,
}: {
  resetSearch: () => void;
}) {
  const router = useRouter();
  return (
    <div>
      <div>
        This job is not available via USA jobs API. You can try using our search
        function, or pasting a different job URL
      </div>
      <button
        onClick={() => {
          resetSearch();
        }}
      >
        Back to paste a different job URL
      </button>
      <button
        onClick={() => {
          router.push("/ally/job-search/");
        }}
      >
        Try search.
      </button>
    </div>
  );
}
