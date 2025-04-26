"use client"; // Make sure this is at the top if using app router
import { useContext } from "react";
import { JobSearchContext } from "@/app/providers/providers";
import UsaJobsNoResults from "@/app/components/ally/usaJobsComponents/UsaJobsNoResults";

export default function JobSearchResults() {
  const { searchObject } = useContext(JobSearchContext);

  return <UsaJobsNoResults searchObject={searchObject} />;
}
