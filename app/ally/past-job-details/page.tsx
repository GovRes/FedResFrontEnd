"use client";
import ExperiencePage from "@/app/ally/components/ExperiencePage";
import { topicPastJobMatcher } from "@/app/components/aiProcessing/topicPastJobMatcher";
import { getApplicationAssociations } from "@/app/crud/application";
import { updatePastJobWithQualifications } from "@/app/crud/pastJob";
import { useApplication } from "@/app/providers/applicationContext";
import { PastJobType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";

export default function PastJobDetailsPage() {
  const [loading, setLoading] = useState(true);
  const { applicationId, job } = useApplication();

  useEffect(() => {
    async function fetchAndMatch() {
      setLoading(true);
      const res = await getApplicationAssociations({
        applicationId,
        associationType: "PastJob",
      });
      if (res && res.length > 0 && job && job.topics && job.topics.length > 0) {
        let topicRes = await topicPastJobMatcher({
          pastJobs: res, // Use the fresh data directly
          topics: job.topics,
        });
        await Promise.all(
          topicRes.map(async (item: PastJobType) => {
            let updateRes = await updatePastJobWithQualifications(
              item.id,
              item,
              item.qualifications
            );
          })
        );
      }
      setLoading(false);
    }
    if (applicationId) {
      fetchAndMatch();
    }
  }, [applicationId]);

  if (loading) return <div>Loading...</div>;
  return <ExperiencePage currentStepId="past-job-details" type="PastJob" />;
}
