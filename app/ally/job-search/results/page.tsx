"use client"; // Make sure this is at the top if using app router
import { useContext } from "react";
import UsaJobsResults from "./components/UsaJobsResults";
import { JobSearchContext } from "@/app/providers/jobSearchContext";

export default function JobSearchResults() {
  const { searchResults, setSearchObject } = useContext(JobSearchContext);

  return (
    <UsaJobsResults
      searchResults={searchResults}
      setShowSearchForm={setSearchObject}
    />
  );
}
