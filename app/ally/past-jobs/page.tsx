"use client";
import React, { useState, useEffect } from "react";
import InitialReview from "@/app/ally/components/InitialReview";
import { PastJobType } from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useApplication } from "@/app/providers/applicationContext";
import { fetchUserAssociations } from "@/lib/crud/userAssociations";
export default function pastJobsPage() {
  const [localPastJobs, setLocalPastJobs] = useState<PastJobType[]>([]);
  const { job } = useApplication();
  const { user } = useAuthenticator();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndMatch() {
      if (!user) return;
      setLoading(true);
      // Fetch past jobs
      let { data } = await fetchUserAssociations("PastJob");
      if (data && data.length > 0) {
        const filteredJobs = data?.filter(
          (job) => job.type === "PastJob"
        ) as PastJobType[];
        setLocalPastJobs(filteredJobs);
      }
      setLoading(false);
    }

    fetchAndMatch();
  }, [user?.userId, job?.topics]);

  if (loading) {
    return <Loader text="fetching your saved jobs" />;
  }

  return (
    <InitialReview
      currentStepId="past-jobs"
      itemType="PastJob"
      localItems={localPastJobs}
      setLocalItems={setLocalPastJobs}
    />
  );
}
