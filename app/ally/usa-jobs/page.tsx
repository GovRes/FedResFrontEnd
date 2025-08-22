"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function UsaJobsPage() {
  const router = useRouter();

  return (
    <div>
      <h2>
        To start your application, you can either use our job search function or
        paste a job url from USAJobs.gov.
      </h2>
      <Link href="/ally/job-search">Search for a job</Link>
      <br />
      <Link href="/ally/job-paste">Paste a job URL</Link>
    </div>
  );
}
