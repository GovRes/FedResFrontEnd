"use client";
import React, { useState, useEffect } from "react";
import InitialReview from "@/app/components/ally/sharedComponents/InitialReview";
import { PastJobType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { listUserModelRecords } from "@/app/crud/genericListForUser";
import { useAuthenticator } from "@aws-amplify/ui-react";
export default function volunteersPage() {
  const [localPastJobs, setLocalPastJobs] = useState<PastJobType[]>([]);

  const { user } = useAuthenticator();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getpastJobs() {
      if (!user) return;
      setLoading(true);
      let res = await listUserModelRecords("PastJob", user.userId);
      if (res.items.length > 0) {
        res.items = res.items.filter(
          (job: PastJobType) => job.type === "Volunteer"
        );
        setLocalPastJobs(res.items);
      }
      setLoading(false);
    }
    getpastJobs();
  }, [JSON.stringify(user)]);

  if (loading) {
    return <TextBlinkLoader text="fetching your saved volunteer experiences" />;
  }

  return (
    <InitialReview
      currentStepId="volunteer-experiences"
      itemType="PastJob"
      localItems={localPastJobs}
      setLocalItems={setLocalPastJobs}
    />
  );
}
