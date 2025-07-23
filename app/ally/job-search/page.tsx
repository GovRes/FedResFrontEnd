"use client";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JobSearchContext } from "@/app/providers/jobSearchContext";
import UsaJobsSearch from "@/app/ally/job-search/components/UsaJobsSearch";
import { Loader } from "@/app/components/loader/Loader";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { JobSearchObject } from "@/app/utils/responseSchemas";
import { useLoading } from "@/app/providers/loadingContext";

export default function JobSearchPage() {
  const router = useRouter();
  const { setSearchResults, searchObject, setSearchObject } =
    useContext(JobSearchContext);
  const { user, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);
  const { setIsLoading } = useLoading();
  useEffect(() => {
    async function getUserAttributes() {
      if (authStatus === "authenticated") {
        const attr = await fetchUserAttributes();
        setSearchObject((prev: JobSearchObject | null) =>
          prev
            ? {
                ...prev,
                user: {
                  ...attr,
                  id: user.userId,
                  email: user?.signInDetails?.loginId || "no email",
                },
              }
            : {
                user: {
                  ...attr,
                  id: user.userId,
                  email: user?.signInDetails?.loginId || "no email",
                },
              }
        );
      }
    }
    getUserAttributes();
  }, [user, authStatus]);

  const handleSearchComplete = (results: JobSearchObject[]) => {
    if (results.length === 0) {
      setIsLoading(true);
      router.push("/ally/job-search/no-results");
      return;
    } else {
      setSearchResults(results);
      setIsLoading(true);
      router.push("/ally/job-search/results");
    }
  };

  if (!searchObject) {
    return <Loader text="Warming up the engines" />;
  }

  return (
    <UsaJobsSearch
      searchObject={searchObject}
      setSearchObject={setSearchObject}
      setSearchResults={handleSearchComplete}
    />
  );
}
