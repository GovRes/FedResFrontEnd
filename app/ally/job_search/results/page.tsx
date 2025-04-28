"use client"; // Make sure this is at the top if using app router
import { useContext } from "react";
import UsaJobsResults from "@/app/components/ally/usaJobsComponents/UsaJobsResults";
import { JobSearchContext } from "@/app/providers/providers";

export default function JobSearchResults() {
  const { searchResults, setSearchObject } = useContext(JobSearchContext);

  return (
    <UsaJobsResults
      searchResults={searchResults} // Make sure you're passing searchResults here, not searchObject
      setShowSearchForm={setSearchObject}
    />
  );
}
