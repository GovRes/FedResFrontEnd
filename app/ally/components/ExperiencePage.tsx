import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { getApplicationAssociations } from "@/app/crud/application";
import {
  findNextIncompleteStep,
  useNextStepNavigation,
} from "@/app/utils/nextStepNavigation";
import { completeSteps } from "@/app/utils/stepUpdater";
import { PastJobType } from "@/app/utils/responseSchemas";
export default function PastJobsPage({
  currentStepId,
  experienceType = "PastJob",
}: {
  currentStepId: string;
  experienceType: "PastJob" | "Volunteer";
}) {
  const router = useRouter();
  const { applicationId, setSteps, steps } = useApplication();
  const [loading, setLoading] = useState(true);
  const { navigateToNextIncompleteStep } = useNextStepNavigation();

  // Effect to fetch jobs and automatically redirect to the first one with unconfirmed qualifications
  useEffect(() => {
    async function fetchJobsAndRedirect() {
      if (!applicationId) return;

      try {
        const pastJobsRes = (await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        })) as PastJobType[];
        console.log(34, pastJobsRes);
        const pastJobs = pastJobsRes.filter(
          (job) => job.type === experienceType
        );

        if (!pastJobs || pastJobs.length === 0) {
          console.log(39, "no past jobs found");
          const updatedSteps = await completeSteps({
            steps,
            stepId: currentStepId,
            applicationId,
          });
          setSteps(updatedSteps);
          navigateToNextIncompleteStep(currentStepId);
          return;
        }

        // 2. Find the first job with unconfirmed qualifications
        const jobWithUnconfirmedQuals =
          findJobWithUnconfirmedQualifications(pastJobs);

        if (jobWithUnconfirmedQuals) {
          // 3. Redirect to that job's qualifications page
          router.push(
            `/ally/past-experience/${currentStepId}/${jobWithUnconfirmedQuals.id}`
          );
        } else {
          // All qualifications are confirmed, move to next step
          const updatedSteps = await completeSteps({
            steps,
            stepId: currentStepId,
            applicationId,
          });
          setSteps(updatedSteps);
          navigateToNextIncompleteStep(currentStepId);
        }
      } catch (error) {
        console.error("Error fetching past jobs:", error);
        setLoading(false);
      }
    }

    if (applicationId) {
      fetchJobsAndRedirect();
    }
  }, [applicationId, router]);

  // Helper function to find a job with at least one unconfirmed qualification
  function findJobWithUnconfirmedQualifications(
    jobs: PastJobType[]
  ): PastJobType | null {
    // First priority: Job with at least one unconfirmed qualification
    const jobWithUnconfirmedQual = jobs.find(
      (job) =>
        job.qualifications &&
        job.qualifications.some((qual) => qual.userConfirmed === false)
    );

    if (jobWithUnconfirmedQual) {
      return jobWithUnconfirmedQual;
    }

    // Second priority: Job with no qualifications at all
    const jobWithNoQuals = jobs.find(
      (job) => !job.qualifications || job.qualifications.length === 0
    );

    if (jobWithNoQuals) {
      return jobWithNoQuals;
    }

    // If all jobs have confirmed qualifications, return null
    return null;
  }

  // Just show a loading screen as we're going to redirect automatically
  return <TextBlinkLoader text="Finding your job experience details..." />;
}
