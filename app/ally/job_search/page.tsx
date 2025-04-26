"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JobSearchContext } from "@/app/providers/providers";
import UsaJobsSearch from "@/app/components/ally/usaJobsComponents/UsaJobsSearch";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { JobSearchObject } from "@/app/utils/responseSchemas";

export default function JobSearchPage() {
  const router = useRouter();
  const { setSearchResults, searchObject, setSearchObject } =
    useContext(JobSearchContext);
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);

  useEffect(() => {
    async function getUserAttributes() {
      if (authStatus === "authenticated") {
        const attr = await fetchUserAttributes();
        setSearchObject((prev: JobSearchObject) => ({ ...prev, user: attr }));
      }
    }
    getUserAttributes();
  }, [user, authStatus]);

  const handleSearchComplete = (results: JobSearchObject[]) => {
    if (results.length === 0) {
      router.push("/ally/job_search/no_results");
      return;
    } else {
      setSearchResults(results);
      router.push("/ally/job_search/results");
    }
  };

  if (!searchObject) {
    return <TextBlinkLoader text="Warming up the engines" />;
  }

  return (
    <UsaJobsSearch
      searchObject={searchObject}
      setSearchObject={setSearchObject}
      setSearchResults={handleSearchComplete}
    />
  );
}
