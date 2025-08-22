// FixedPastJobsPage.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { getApplicationAssociations } from "@/lib/crud/application";
import {
  PastJobApplicationsApiResponse,
  PastJobType,
} from "@/lib/utils/responseSchemas";
import { convertPastJobsResponse } from "@/lib/utils/pastJobsResponseFormatter";
import styles from "@/app/ally/components/ally.module.css";
import { navigateToNextIncompleteStep } from "@/lib/utils/nextStepNavigation";

export default function ExperiencePage({
  currentStepId,
  type,
}: {
  currentStepId: string;
  type: "PastJob" | "Volunteer";
}) {
  const router = useRouter();
  const { applicationId, completeStep, steps } = useApplication();
  const [loading, setLoading] = useState(true);
  const [pastJobs, setPastJobs] = useState<PastJobType[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Add refs to prevent multiple executions
  const hasRedirected = useRef(false);
  const isProcessing = useRef(false);

  // Check if the past-job-details step is complete
  const isPastJobDetailsStepComplete =
    steps.find((step) => step.id === "past-job-details")?.completed || false;

  async function markCompleteAndNavigate() {
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    console.log("Navigating to next step");
    navigateToNextIncompleteStep({
      steps,
      router,
      currentStepId,
      applicationId,
      completeStep,
    });
  }

  useEffect(() => {
    async function fetchJobsAndRedirect() {
      // Prevent multiple concurrent executions
      if (isProcessing.current) {
        console.log("Already processing, skipping duplicate execution");
        return;
      }

      if (!applicationId) {
        setError("No application ID found");
        setLoading(false);
        return;
      }

      isProcessing.current = true;

      try {
        // Fetch all past jobs
        const { data } = await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        });
        console.log("Fetched past jobs data:", data);

        console.log("filter type is", type);
        const pastJobs = data?.filter((job) => job.type === type) || [];
        console.log("Filtered past jobs:", pastJobs);

        // Store jobs in state for the job list view
        setPastJobs(pastJobs);

        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const viewMode = urlParams.get("view") === "list";

        // If we're in list view mode, just display the list
        if (viewMode) {
          console.log("In list view mode, showing jobs");
          setLoading(false);
          return;
        }

        // If no jobs, move to the next step
        if (!pastJobs || pastJobs.length === 0) {
          console.log(
            "No past jobs found, marking step complete and navigating"
          );
          await markCompleteAndNavigate();
          return;
        }

        // Find a job with unconfirmed qualifications
        const jobWithUnconfirmedQuals = pastJobs.find((job) =>
          job.qualifications?.some(
            (qual: { applicationIds: string[]; userConfirmed: boolean }) =>
              qual.applicationIds?.includes(applicationId) &&
              !qual.userConfirmed
          )
        );

        if (jobWithUnconfirmedQuals) {
          console.log(
            "Found job with unconfirmed qualifications, redirecting to it"
          );

          // Prevent multiple redirects
          if (hasRedirected.current) {
            console.log("Already redirected, skipping");
            return;
          }
          hasRedirected.current = true;

          // Use router.replace instead of router.push to prevent back navigation issues
          router.replace(
            `/ally/${currentStepId}/${jobWithUnconfirmedQuals.id}`
          );
          return;
        } else {
          // If the step is not complete but all qualifications are confirmed,
          // we can move to the next step
          console.log(
            "All qualifications confirmed, checking if step is complete"
          );
          if (!isPastJobDetailsStepComplete) {
            await markCompleteAndNavigate();
          } else {
            // If step is complete, just show the list of jobs
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching past jobs:", error);
        setError("Error loading jobs. Please try again.");
        setLoading(false);
      } finally {
        isProcessing.current = false;
      }
    }

    fetchJobsAndRedirect();
  }, [applicationId, type]); // Remove other dependencies that might cause re-runs

  // Function to navigate to a job's details page in edit mode
  const navigateToJobEdit = (jobId: string) => {
    console.log("Navigating to job edit page for job ID:", jobId);
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
        <button
          onClick={() => {
            router.push("/ally");
          }}
        >
          Return to Home
        </button>
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
            onClick={() => markCompleteAndNavigate()}
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
                  {job.qualifications?.filter(
                    (q: { userConfirmed: any }) => q.userConfirmed
                  ).length || 0}
                </span>
              </div>
            </div>

            <div className={styles.jobCardActions}>
              <button
                onClick={() => job.id && navigateToJobEdit(job.id)}
                className={styles.editButton}
              >
                {job.qualifications?.every(
                  (q: { userConfirmed: any }) => q.userConfirmed
                )
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
          <button
            onClick={() => {
              router.push("/ally");
            }}
          >
            Return to Home
          </button>
        </div>
      )}
    </div>
  );
}
