"use client";
import React, { useState, useEffect } from "react";
import InitialReview from "@/app/components/ally/sharedComponents/InitialReview";
import { UserJobType } from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { fetchUserPositionRecords } from "@/app/crud/userJobAndVolunteer";
import { useAuthenticator } from "@aws-amplify/ui-react";
export default function UserJobsPage() {
  const [localUserJobs, setLocalUserJobs] = useState<UserJobType[]>([]);

  const { user } = useAuthenticator();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getUserJobs() {
      if (!user) return;
      setLoading(true);
      let res = await fetchUserPositionRecords("UserJob", user.userId);
      if (res.items.length > 0) {
        setLocalUserJobs(res.items);
      }
      setLoading(false);
    }
    getUserJobs();
  }, [JSON.stringify(user)]);

  if (loading) {
    return <TextBlinkLoader text="fetching your saved jobs" />;
  }

  return (
    <InitialReview
      currentStepId="user-jobs"
      itemType="UserJob"
      localItems={localUserJobs}
      setLocalItems={setLocalUserJobs}
      nextPath={"/ally/past-experience/awards"}
    />
  );
}
