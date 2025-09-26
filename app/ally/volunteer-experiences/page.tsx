"use client";
import React, { useState, useEffect } from "react";
import InitialReview from "@/app/ally/components/InitialReview";
import { PastJobType } from "@/lib/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";
import { listUserModelRecords } from "@/lib/crud/genericListForUser";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useApplication } from "@/app/providers/applicationContext";
import { topicPastJobMatcher } from "@/lib/aiProcessing/topicPastJobMatcher";
export default function volunteersPage() {
  const [localPastJobs, setLocalPastJobs] = useState<PastJobType[]>([]);
  const { job } = useApplication();
  const { user } = useAuthenticator();

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(
    "Loading volunteer experiences..."
  );
  useEffect(() => {
    async function getpastJobs() {
      if (!user) return;
      setLoading(true);
      let { data } = await listUserModelRecords("PastJob", user.userId);
      if (data && data.items.length > 0) {
        data.items = data.items.filter(
          (job: PastJobType) => job.type === "Volunteer"
        );
        setLocalPastJobs(data.items);
      }
      setLoading(false);
    }
    getpastJobs();
  }, [user?.userId]);

  useEffect(() => {
    async function matchJobsToTopics(): Promise<void> {
      setLoading(true);
      if (
        localPastJobs.length > 0 &&
        job &&
        job.topics &&
        job.topics.length > 0
      ) {
        // Create promises for all topic matching operations
        const topicPromises: Promise<PastJobType[] | PastJobType | void>[] =
          job.topics.map(async (topic) => {
            setLoadingText(`finding matches for ${topic.title}`);
            return await topicPastJobMatcher({
              topic,
              pastJobs: localPastJobs,
            });
          });

        // Wait for all topic matching to complete
        const topicResults = await Promise.all(topicPromises);

        // Flatten and filter results, handling different return types
        const allMatchedJobs: PastJobType[] = topicResults
          .flatMap((result) => {
            if (!result) return [];
            return Array.isArray(result) ? result : [result];
          })
          .filter((item): item is PastJobType => Boolean(item));
      }
    }
    if (localPastJobs.length > 0) {
      setLoading(true);
      matchJobsToTopics();
      setLoading(false);
    }
  }, [JSON.stringify(localPastJobs)]);

  if (loading) {
    return <Loader text={loadingText} />;
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
