"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import {
  associateItemsWithApplication,
  getApplicationPastJobs,
} from "@/lib/crud/application";
import { updatePastJobWithQualifications } from "@/lib/crud/pastJob";
import { topicPastJobMatcher } from "@/lib/aiProcessing/topicPastJobMatcher";
import { PastJobType, QualificationType } from "@/lib/utils/responseSchemas";
import { createQualification } from "@/lib/crud/qualifications";
import styles from "@/app/ally/components/ally.module.css";
import { navigateToNextIncompleteStep } from "@/lib/utils/nextStepNavigation";

interface ExperiencePageProps {
  currentStepId: string;
  type: "PastJob" | "Volunteer";
}

// Interface for the new API response format
interface NewQualificationItem {
  pastJobId: string;
  qualification: QualificationType;
}

interface TopicMatcherResponse {
  newQualifications: NewQualificationItem[];
}

export default function ExperiencePage({
  currentStepId,
  type,
}: ExperiencePageProps) {
  const router = useRouter();
  const {
    applicationId,
    completeStep,
    steps,
    job,
    isProcessingComplete,
    markProcessingComplete,
  } = useApplication();

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(
    "Loading experience details..."
  );
  const [pastJobs, setPastJobs] = useState<PastJobType[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Add refs to prevent multiple executions
  const hasRedirected = useRef(false);
  const isProcessing = useRef(false);

  // Check if the past-job-details step is complete
  const isPastJobDetailsStepComplete =
    steps.find((step) => step.id === "past-job-details")?.completed || false;

  async function markCompleteAndNavigate(): Promise<void> {
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

  async function performAIProcessing(): Promise<void> {
    if (!applicationId || !job?.topics) {
      console.log("Missing applicationId or job topics for AI processing");
      return;
    }

    let userId: string | undefined;

    setLoadingText("AI matching topics to experiences...");
    console.log("Starting AI processing for application:", applicationId);

    try {
      // Get past jobs for processing
      const { data } = await getApplicationPastJobs({
        applicationId,
      });

      if (!data || data.length === 0) {
        console.log("No past jobs found for AI processing");
        return;
      }

      // Extract userId from the first past job
      userId = data[0]?.userId;
      if (!userId) {
        console.error("No userId found in past jobs data");
        throw new Error(
          "Unable to determine user ID for qualification creation"
        );
      }
      console.log("Using userId:", userId);

      const totalTopics = job.topics.length;
      console.log(`Processing ${totalTopics} topics in batch`, job.topics);

      // Track all qualifications for final association
      const allQualificationsToAssociate: QualificationType[] = [];

      // ✅ OPTIMIZED: Process ALL topics in a single batch API call
      console.log(`\n=== BATCH Processing ${totalTopics} topics ===`);

      setLoadingText(
        `AI matching all ${totalTopics} topics to your experience...`
      );

      // Call AI once with ALL topics - returns only NEW qualifications
      const topicMatcherResponse = (await topicPastJobMatcher({
        topics: job.topics,
        pastJobs: data,
      })) as TopicMatcherResponse;

      console.log(`AI batch response received:`, topicMatcherResponse);

      // Extract new qualifications from response
      const newQualifications = topicMatcherResponse?.newQualifications || [];

      console.log(
        `AI returned ${newQualifications.length} new qualifications to create`
      );

      if (newQualifications.length === 0) {
        console.log("No new qualifications to create");
        return;
      }

      // Process each new qualification
      setLoadingText("Creating qualifications from AI matches...");

      // Group qualifications by job for logging
      const qualsByJob = newQualifications.reduce(
        (acc: Record<string, number>, item) => {
          acc[item.pastJobId] = (acc[item.pastJobId] || 0) + 1;
          return acc;
        },
        {}
      );
      console.log("New qualifications by job:", qualsByJob);

      for (const { pastJobId, qualification: qual } of newQualifications) {
        // Find the job this qualification belongs to
        const currentJobState = data.find(
          (job: PastJobType) => job.id === pastJobId
        );

        if (!currentJobState) {
          console.warn(`Could not find job ${pastJobId} in current data`);
          continue;
        }

        // CRITICAL: Only use topic.id from the topic object (should be a UUID)
        const topicId = qual.topic?.id;

        if (!topicId || topicId.trim() === "") {
          console.error(`❌ Skipping qualification - missing topic.id`);
          continue;
        }

        // Validate it's a UUID format
        if (topicId.length < 20 || !topicId.includes("-")) {
          console.error(
            `❌ Skipping qualification - topic.id "${topicId}" is not a UUID`
          );
          continue;
        }

        if (!qual.title || qual.title.trim() === "") {
          console.error(`❌ Skipping qualification - missing title`);
          continue;
        }

        const newQualData = {
          title: qual.title.trim(),
          description:
            qual.description?.trim() ||
            "This qualification demonstrates relevant experience.",
          paragraph: qual.paragraph?.trim() || "",
          question: qual.question?.trim() || "",
          topicId: topicId,
          pastJobId: pastJobId,
          userId: userId,
          userConfirmed: false,
        };

        console.log("Creating qualification:", {
          title: newQualData.title,
          topicId: newQualData.topicId,
          pastJobId: newQualData.pastJobId,
          jobTitle: currentJobState.title,
        });

        try {
          const { data: createdQual, error: createError } =
            await createQualification(newQualData);

          if (createError) {
            console.error("Error creating qualification:", createError);
            continue;
          }

          if (!createdQual) {
            console.error("No qualification data returned from create");
            continue;
          }

          console.log(`✅ Created qualification: ${createdQual.title}`);
          allQualificationsToAssociate.push(createdQual);
        } catch (error) {
          console.error("Exception creating qualification:", error);
        }
      }

      // Associate all created qualifications with the application
      if (allQualificationsToAssociate.length > 0) {
        setLoadingText("Associating qualifications with application...");
        console.log(
          `Associating ${allQualificationsToAssociate.length} qualifications with application`
        );

        const qualificationIds = allQualificationsToAssociate
          .map((q) => q.id)
          .filter((id): id is string => Boolean(id));

        const associationResult = await associateItemsWithApplication({
          applicationId,
          items: qualificationIds,
          associationType: "Qualification",
        });

        if (associationResult.error) {
          console.error(
            "Error associating qualifications:",
            associationResult.error
          );
        } else {
          console.log(
            `✅ Successfully associated ${qualificationIds.length} qualifications with application`
          );
        }
      }

      console.log(
        `\n=== BATCH Processing Complete: ${allQualificationsToAssociate.length} qualifications created ===\n`
      );
    } catch (error) {
      console.error("Error in AI processing:", error);
      throw error;
    }
  }

  async function fetchJobsAndRedirect(): Promise<void> {
    if (!applicationId) return;

    try {
      const { data } = await getApplicationPastJobs({
        applicationId: applicationId,
      });

      console.log("Fetched past jobs data:", data);
      console.log("Filter type is", type);

      const pastJobs =
        data?.filter((job: PastJobType) => job.type === type) || [];
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
        console.log("No past jobs found, marking step complete and navigating");
        await markCompleteAndNavigate();
        return;
      }

      // Find a job with unconfirmed qualifications
      const jobWithUnconfirmedQuals = pastJobs.find((job: PastJobType) =>
        job.qualifications?.some(
          (qual: QualificationType & { applicationIds?: string[] }) =>
            qual.applicationIds?.includes(applicationId) && !qual.userConfirmed
        )
      );

      if (jobWithUnconfirmedQuals) {
        console.log(
          "Found job with unconfirmed qualifications, redirecting to it"
        );

        if (hasRedirected.current) {
          console.log("Already redirected, skipping");
          return;
        }
        hasRedirected.current = true;

        router.replace(`/ally/${currentStepId}/${jobWithUnconfirmedQuals.id}`);
        return;
      } else {
        console.log(
          "All qualifications confirmed, checking if step is complete"
        );
        if (!isPastJobDetailsStepComplete) {
          await markCompleteAndNavigate();
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching past jobs:", error);
      setError("Error loading jobs. Please try again.");
      setLoading(false);
    }
  }

  useEffect(() => {
    async function processAndFetch(): Promise<void> {
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
      setLoading(true);

      try {
        // Check if AI processing has already been completed
        if (!isProcessingComplete("pastJobs")) {
          console.log("Starting AI processing...");

          // Check if we already have qualifications for this application
          const { data: existingData } = await getApplicationPastJobs({
            applicationId,
          });

          if (existingData && existingData.length > 0) {
            const hasExistingQualifications = existingData.some(
              (pastJob: PastJobType) =>
                pastJob.qualifications?.some(
                  (qual: QualificationType & { applicationIds?: string[] }) =>
                    qual.applicationIds?.includes(applicationId)
                )
            );

            if (hasExistingQualifications) {
              console.log(
                "Qualifications already exist, skipping AI processing"
              );
              markProcessingComplete("pastJobs");
            } else {
              // Perform AI processing with batch approach
              await performAIProcessing();
              markProcessingComplete("pastJobs");
            }
          } else {
            console.log("No past jobs found, marking processing complete");
            markProcessingComplete("pastJobs");
          }
        } else {
          console.log("AI processing already completed, skipping");
        }

        // Always fetch and handle the redirect logic
        await fetchJobsAndRedirect();
      } catch (error) {
        console.error("Error in processAndFetch:", error);
        setError("Error processing job details. Please try again.");
        setLoading(false);
      } finally {
        isProcessing.current = false;
      }
    }

    processAndFetch();
  }, [applicationId, type, isProcessingComplete, markProcessingComplete]);

  // Function to navigate to a job's details page in edit mode
  const navigateToJobEdit = (jobId: string): void => {
    console.log("Navigating to job edit page for job ID:", jobId);
    router.push(`/ally/${currentStepId}/${jobId}?edit=true`);
  };

  // If still loading
  if (loading) {
    return <Loader text={loadingText} />;
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
        {pastJobs.map((job: PastJobType) => (
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
                    (q: QualificationType) => q.userConfirmed
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
                  (q: QualificationType) => q.userConfirmed
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
