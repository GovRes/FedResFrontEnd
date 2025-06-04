"use client";
import React, { useState, useEffect } from "react";
import InitialReview from "@/app/components/ally/InitialReview";
import { PastJobType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { listUserModelRecords } from "@/app/crud/genericListForUser";
import { useAuthenticator } from "@aws-amplify/ui-react";
export default function pastJobsPage() {
  const [localpastJobs, setLocalpastJobs] = useState<PastJobType[]>([]);

  const { user } = useAuthenticator();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getpastJobs() {
      if (!user) return;
      setLoading(true);
      let res = await listUserModelRecords("PastJob", user.userId);
      if (res.items.length > 0) {
        res.items = res.items.filter(
          (job: PastJobType) => job.type === "PastJob"
        );
        setLocalpastJobs(res.items);
      }
      setLoading(false);
    }
    getpastJobs();
  }, [JSON.stringify(user)]);

  if (loading) {
    return <TextBlinkLoader text="fetching your saved jobs" />;
  }

  return (
    <InitialReview
      currentStepId="past-jobs"
      itemType="PastJob"
      localItems={localpastJobs}
      setLocalItems={setLocalpastJobs}
    />
  );
}
