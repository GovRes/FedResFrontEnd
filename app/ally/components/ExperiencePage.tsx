// FixedPastJobsPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { getApplicationAssociations } from "@/app/crud/application";
import { PastJobType } from "@/app/utils/responseSchemas";
import styles from "@/app/components/ally/ally.module.css";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";

export default function ExperiencePage({
  currentStepId,
  type,
}: {
  currentStepId: string;
  type: "PastJob" | "Volunteer";
}) {
  const router = useRouter();
  const { applicationId, steps } = useApplication();
  const [loading, setLoading] = useState(true);
  const [pastJobs, setPastJobs] = useState<PastJobType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  // Check if the past-job-details step is complete
  const isPastJobDetailsStepComplete =
    steps.find((step) => step.id === "past-job-details")?.completed || false;
  console.log(22);
  useEffect(() => {
    async function fetchJobsAndRedirect() {
      if (!applicationId) {
        setError("No application ID found");
        setLoading(false);
        return;
      }

      try {
        // Fetch all past jobs
        const pastJobsRes = (await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        })) as PastJobType[];
        const pastJobs = pastJobsRes.filter((job) => job.type === type);
        console.log(pastJobsRes, 30, type);

        // Store jobs in state for the job list view
        setPastJobs(pastJobs);

        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const viewMode = urlParams.get("view") === "list";

        // If we're in list view mode, just display the list
        if (viewMode) {
          setLoading(false);
          return;
        }

        // If no jobs, move to the next step
        if (!pastJobs || pastJobs.length === 0) {
          console.log("no jobs");
          navigateToNextIncompleteStep(currentStepId);
          return;
        }

        // Find a job with unconfirmed qualifications
        const jobWithUnconfirmedQuals = pastJobs.find((job) =>
          job.qualifications?.some((qual) => !qual.userConfirmed)
        );
        console.log(70, jobWithUnconfirmedQuals);
        if (jobWithUnconfirmedQuals) {
          console.log(63);
          // Redirect to the job with unconfirmed qualifications
          router.push(`/ally/${currentStepId}/${jobWithUnconfirmedQuals.id}`);
        } else {
          // If the step is not complete but all qualifications are confirmed,
          // we can move to the next step
          console.log(71);
          if (!isPastJobDetailsStepComplete) {
            navigateToNextIncompleteStep(currentStepId);
          } else {
            // If step is complete, just show the list of jobs
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching past jobs:", error);
        setError("Error loading jobs. Please try again.");
        setLoading(false);
      }
    }

    fetchJobsAndRedirect();
  }, [applicationId, router, isPastJobDetailsStepComplete]);

  // Function to navigate to a job's details page in edit mode
  const navigateToJobEdit = (jobId: string) => {
    router.push(`/ally/${currentStepId}/${jobId}?edit=true`);
  };

  // If still loading
  if (loading) {
    return <Loader text="Finding job experience details..." />;
  }

  // If there's an error
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => router.push("/ally")}>Return to Home</button>
      </div>
    );
  }

  // If all jobs are complete, show a list of jobs that can be edited
  return (
    <div className={styles.completedJobsContainer}>
      <h2>Your Past Experience</h2>

      {isPastJobDetailsStepComplete ? (
        <div className={styles.completedMessage}>
          <p>
            You've completed all your job experience paragraphs. You can
            continue to the next step or edit your existing paragraphs.
          </p>
          <button
            className={styles.continueButton}
            onClick={() => navigateToNextIncompleteStep(currentStepId)}
          >
            Continue
          </button>
        </div>
      ) : (
        <p>Select a job to view or edit its qualifications:</p>
      )}

      <div className={styles.jobsList}>
        {pastJobs.map((job) => (
          <div key={job.id} className={styles.jobCard}>
            <div className={styles.jobCardHeader}>
              <h3>{job.title}</h3>
              <span>{job.organization}</span>
            </div>

            <div className={styles.jobCardStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Qualifications:</span>
                <span className={styles.statValue}>
                  {job.qualifications?.length || 0}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Completed:</span>
                <span className={styles.statValue}>
                  {job.qualifications?.filter((q) => q.userConfirmed).length ||
                    0}
                </span>
              </div>
            </div>

            <div className={styles.jobCardActions}>
              <button
                onClick={() => navigateToJobEdit(job.id)}
                className={styles.editButton}
              >
                {job.qualifications?.every((q) => q.userConfirmed)
                  ? "Edit Paragraphs"
                  : "Complete Qualifications"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {pastJobs.length === 0 && (
        <div className={styles.emptyState}>
          <p>No past jobs found. Please add some job experiences first.</p>
          <button onClick={() => router.push("/ally")}>Return to Home</button>
        </div>
      )}
    </div>
  );
}
