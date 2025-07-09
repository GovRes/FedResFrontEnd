"use client";
import React, { useState, useEffect } from "react";
import InitialReview from "@/app/components/ally/InitialReview";
import { PastJobType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { listUserModelRecords } from "@/app/crud/genericListForUser";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useApplication } from "@/app/providers/applicationContext";
import { topicPastJobMatcher } from "@/app/components/aiProcessing/topicPastJobMatcher";
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
      let res = await listUserModelRecords("PastJob", user.userId);
      if (res.items.length > 0) {
        res.items = res.items.filter(
          (job: PastJobType) => job.type === "PastJob"
        );
        setLocalPastJobs(res.items);
      }
      setLoading(false);
    }

    fetchAndMatch();
  }, [JSON.stringify(user), job?.topics]);

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
