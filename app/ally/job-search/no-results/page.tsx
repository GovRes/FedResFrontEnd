"use client"; // Make sure this is at the top if using app router
import { useJobSearch } from "@/app/providers/jobSearchContext";
import UsaJobsNoResults from "@/app/ally/job-search/no-results/components/UsaJobsNoResults";

export default function JobSearchResults() {
  const { searchObject } = useJobSearch();

  if (!searchObject) {
    return null; // or some loading state/fallback UI
  }

  return <UsaJobsNoResults searchObject={searchObject} />;
}
