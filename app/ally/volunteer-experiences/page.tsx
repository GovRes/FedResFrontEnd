"use client";
import React, { useState, useEffect } from "react";
import InitialReview from "@/app/components/ally/InitialReview";
import { PastJobType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { listUserModelRecords } from "@/app/crud/genericListForUser";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useApplication } from "@/app/providers/applicationContext";
import { topicPastJobMatcher } from "@/app/components/aiProcessing/topicPastJobMatcher";
export default function volunteersPage() {
  const [localPastJobs, setLocalPastJobs] = useState<PastJobType[]>([]);
  const { job } = useApplication();
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

  useEffect(() => {
    async function matchJobsToTopics() {
      if (!job || !job.topics || job.topics.length === 0) return;
      await topicPastJobMatcher({
        pastJobs: localPastJobs,
        topics: job?.topics,
      });
    }
    if (localPastJobs.length > 0) {
      setLoading(true);
      matchJobsToTopics();
      setLoading(false);
    }
  }, [JSON.stringify(localPastJobs)]);

  if (loading) {
    return <Loader text="fetching your saved volunteer experiences" />;
  }

  return (
    <InitialReview
      currentStepId="volunteer-experiences"
      itemType="VolunteerExperience"
      localItems={localPastJobs}
      setLocalItems={setLocalPastJobs}
    />
  );
}
