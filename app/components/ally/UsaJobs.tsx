"use client";
import { useEffect, useState } from "react";
import UsaJobsSearch, {
  JobSearchObject,
} from "./usaJobsComponents/UsaJobsSearch";
import UsaJobsResults from "./usaJobsComponents/UsaJobsResults";
import UsaJobsNoResults from "./usaJobsComponents/UsaJobsNoResults";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";
import { TextBlinkLoader } from "../loader/Loader";

export default function UsaJobs() {
  const [showSearchForm, setShowSearchForm] = useState(true);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchObject, setSearchObject] = useState<JobSearchObject>();

  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);

  useEffect(() => {
    async function getUserAttributes() {
      if (authStatus === "authenticated") {
        const attr = await fetchUserAttributes();
        setSearchObject((prev) => ({ ...prev, user: attr }));
      }
    }
    getUserAttributes();
  }, [user, authStatus]);
  if (showSearchForm && searchObject) {
    return (
      <UsaJobsSearch
        searchObject={searchObject}
        setSearchObject={setSearchObject}
        setSearchResults={setSearchResults}
        setShowSearchForm={setShowSearchForm}
      />
    );
    // } else if (searchResults.length === 0 && searchObject) {
    //   return (
    //     <UsaJobsNoResults
    //       searchObject={searchObject}
    //       setShowSearchForm={setShowSearchForm}
    //     />
    //   );
    // } else if (searchResults.length > 0) {
    //   return (
    //     <UsaJobsResults
    //       searchResults={searchResults}
    //       setShowSearchForm={setShowSearchForm}
    //     />
    //   );
  } else {
    return <TextBlinkLoader text="Warming up the engines" />;
  }
}
