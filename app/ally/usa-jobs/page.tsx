"use client";
import { useRouter } from "next/navigation";
export default function UsaJobsPage() {
  const router = useRouter();

  return (
    <div>
      <h2>
        To start your application, you can either use our job search function or
        paste a job url from USAJobs.gov.
      </h2>
      <button onClick={() => router.push("/ally/job-search")}>
        Search for a job
      </button>
      <button onClick={() => router.push("/ally/job-paste")}>
        Paste a job URL
      </button>
    </div>
  );
}
