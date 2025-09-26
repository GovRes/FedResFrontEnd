"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import {
  getApplicationAssociations,
  associateItemsWithApplication,
} from "@/lib/crud/application";
import { updatePastJobWithQualifications } from "@/lib/crud/pastJob";
import { topicPastJobMatcher } from "@/lib/aiProcessing/topicPastJobMatcher";
import {
  PastJobApplicationsApiResponse,
  PastJobType,
  QualificationType,
  TopicType,
  JobType,
} from "@/lib/utils/responseSchemas";
import styles from "@/app/ally/components/ally.module.css";
import { navigateToNextIncompleteStep } from "@/lib/utils/nextStepNavigation";

interface ExperiencePageProps {
  currentStepId: string;
  type: "PastJob" | "Volunteer";
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

    setLoadingText("AI matching topics to experiences...");
    console.log("Starting AI processing for application:", applicationId);

    try {
      // Get past jobs for processing
      const { data } = await getApplicationAssociations({
        applicationId,
        associationType: "PastJob",
      });

      if (!data || data.length === 0) {
        console.log("No past jobs found for AI processing");
        return;
      }

      const totalTopics = job.topics.length;

      // CHANGED: Process each topic serially instead of in parallel
      const topicResults = [];
      for (let i = 0; i < job.topics.length; i++) {
        const topic = job.topics[i];
        console.log(`Processing topic ${i + 1}/${totalTopics}:`, topic);

        try {
          setLoadingText(
            `AI matching topics: ${i + 1}/${totalTopics} topics (${topic.title})`
          );

          const topicMatcherData = await topicPastJobMatcher({
            topic,
            pastJobs: data,
          });

          console.log(`Raw response for topic ${i + 1}:`, topicMatcherData);
          console.log(`Response type:`, typeof topicMatcherData);
          console.log(`Is array:`, Array.isArray(topicMatcherData));

          // Ensure we're pushing the actual data, not a wrapper
          if (topicMatcherData && typeof topicMatcherData === "object") {
            if (Array.isArray(topicMatcherData)) {
              topicResults.push(topicMatcherData);
              console.log(
                `Pushed array of length ${topicMatcherData.length} for topic ${i + 1}`
              );
            } else if (topicMatcherData.pastJobs) {
              topicResults.push(topicMatcherData.pastJobs);
              console.log(
                `Pushed pastJobs array of length ${topicMatcherData.pastJobs.length} for topic ${i + 1}`
              );
            } else {
              console.warn(
                `Unexpected response structure for topic ${i + 1}:`,
                topicMatcherData
              );
              topicResults.push([]);
            }
          } else {
            console.warn(`No valid data for topic ${i + 1}`);
            topicResults.push([]);
          }

          console.log(`Completed topic ${i + 1}/${totalTopics}:`, topic.title);

          // Longer delay to reduce timeouts
          if (i < job.topics.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased to 2 seconds
          }
        } catch (error) {
          console.error(`Failed to process topic ${i + 1}:`, error);
          console.error(
            `Error details:`,
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : String(error)
          );
          // Push empty array to maintain array alignment
          topicResults.push([]);

          // Wait longer after an error before trying the next one
          if (i < job.topics.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds after error
          }
        }
      }

      console.log("Topic matcher results:", topicResults);
      console.log("About to process topicResults with flatMap...");

      // Flatten and filter matched jobs
      const allMatchedJobs: PastJobType[] = topicResults
        .flatMap((result) => {
          console.log("Processing result in flatMap:", result);
          if (!result) return [];
          return Array.isArray(result) ? result : [result];
        })
        .filter((item): item is PastJobType => {
          console.log("Filtering item:", item);
          return Boolean(item);
        });

      console.log("=== BEFORE PROCESSING JOBS ===");
      console.log("allMatchedJobs length:", allMatchedJobs.length);
      console.log("allMatchedJobs:", allMatchedJobs);

      if (allMatchedJobs.length === 0) {
        console.log(
          "No jobs to process - this explains why we never reach association"
        );
        return;
      }

      setLoadingText("Creating job qualifications...");

      // Process each job to create/update qualifications
      const processedJobs = new Map<string, Set<string>>();
      const allQualificationsToAssociate: QualificationType[] = [];

      console.log("=== CREATING UPDATE PROMISES ===");
      const updatePromises = allMatchedJobs.map(
        async (item: PastJobType, index: number) => {
          console.log(
            `Creating promise for job ${index + 1}/${allMatchedJobs.length}:`,
            item.id
          );
          console.log(
            `Job has ${item.qualifications?.length || 0} qualifications`
          );

          if (item.qualifications && item.qualifications.length > 0) {
            console.log("qualifications for job:", item.qualifications);
            console.log(
              "Qualification IDs for job:",
              item.qualifications.map((q: QualificationType) => q.id || "NO_ID")
            );
            console.log(
              "Qualification titles for job:",
              item.qualifications.map(
                (q: QualificationType) => q.title || "NO_TITLE"
              )
            );
          }

          if (!item.qualifications || item.qualifications.length === 0) {
            console.log(
              `Skipping job ${item.id} instance ${index} as it has no qualifications`
            );
            return null;
          }

          try {
            console.log(
              `Updating past job ${item.id} with ${item.qualifications.length} qualifications`
            );

            // Ensure all qualifications start as unconfirmed and have valid topicId
            const unconfirmedQualifications = item.qualifications.map(
              (q: QualificationType) => ({
                ...q,
                userConfirmed: false,
                paragraph: q.paragraph || "",
                // Ensure topicId is not an empty string - DynamoDB doesn't allow empty strings in GSI keys
                topicId:
                  q.topicId && q.topicId.trim() !== "" ? q.topicId : undefined,
              })
            );

            const updateResult = await updatePastJobWithQualifications(
              item.id!,
              item,
              unconfirmedQualifications
            );

            if (!updateResult.success) {
              throw new Error(
                `Failed to update past job: ${updateResult.error}`
              );
            }

            console.log(
              `Successfully updated job ${item.id} with qualifications`
            );

            const updatedPastJob = updateResult.data;
            console.log(
              "Qualification IDs after update:",
              updatedPastJob.qualifications?.map((q: QualificationType) => q.id)
            );

            if (
              updatedPastJob?.qualifications &&
              updatedPastJob.qualifications.length > 0
            ) {
              const qualificationObjects = updatedPastJob.qualifications.map(
                (qualification: any) =>
                  ({
                    id: qualification.id,
                    title: qualification.title,
                    description: qualification.description,
                    paragraph: qualification.paragraph || "",
                    question: qualification.question,
                    userConfirmed: qualification.userConfirmed || false,
                    topicId: qualification.topicId,
                    userId: qualification.userId,
                    topic: qualification.topic,
                  }) as QualificationType
              );

              console.log(
                `Extracted ${qualificationObjects.length} qualification objects from job ${item.id}`
              );

              if (!processedJobs.has(item.id!)) {
                processedJobs.set(item.id!, new Set());
              }

              const jobQualifications = processedJobs.get(item.id!)!;
              qualificationObjects.forEach((qual: QualificationType) => {
                if (!jobQualifications.has(qual.id!)) {
                  jobQualifications.add(qual.id!);
                  allQualificationsToAssociate.push(qual);
                }
              });

              return qualificationObjects;
            } else {
              console.warn(
                `No qualifications found in updated past job ${item.id} response`
              );
              return null;
            }
          } catch (error) {
            console.error(
              `Failed to process job ${item.id} instance ${index}:`,
              error
            );
            return null;
          }
        }
      );

      console.log("Created", updatePromises.length, "update promises");

      const updateResults = await Promise.allSettled(updatePromises);
      console.log(
        "Promise.allSettled completed with",
        updateResults.length,
        "results"
      );

      // Check results and log any failures
      updateResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Job ${index + 1} update failed:`, result.reason);
        } else {
          console.log(`Job ${index + 1} update succeeded`);
        }
      });

      // Continue with successful results only
      const successfulResults = updateResults
        .filter(
          (result): result is PromiseFulfilledResult<any> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value)
        .filter(Boolean);

      console.log(
        `Processed ${successfulResults.length} job instances successfully`
      );
      console.log(
        `Total unique qualifications to associate: ${allQualificationsToAssociate.length}`
      );

      if (allQualificationsToAssociate.length > 0) {
        setLoadingText("Associating qualifications with application...");

        console.log("=== ASSOCIATION DEBUG ===");
        console.log("Application ID:", applicationId);
        console.log(
          "Qualifications to associate:",
          allQualificationsToAssociate.length
        );
        console.log(
          "Qualification IDs:",
          allQualificationsToAssociate.map((q) => q.id)
        );
        console.log("Qualification objects:", allQualificationsToAssociate);

        const associationResult = await associateItemsWithApplication({
          applicationId,
          items: allQualificationsToAssociate,
          associationType: "Qualification",
        });

        console.log("Association result:", associationResult);
        console.log("Association success:", associationResult.success);
        console.log("Association data:", associationResult.data);
        console.log("Association error:", associationResult.error);
        console.log("=========================");

        if (associationResult.success) {
          console.log(
            "Successfully associated qualifications with application"
          );
          if (associationResult.data) {
            console.log("Created associations:", associationResult.data.length);
          }
        } else {
          console.error(
            "Failed to associate qualifications:",
            associationResult.error
          );
          throw new Error(`Association failed: ${associationResult.error}`);
        }
      } else {
        console.log("No qualifications to associate with application");
      }

      console.log("Completed processing all matched jobs");
      console.log(
        "✅ Qualifications created and associated - processing complete"
      );
      console.log(
        "⏱️ Step NOT marked complete - user must confirm each qualification with paragraphs"
      );
      console.log("AI processing completed successfully");
    } catch (error) {
      console.error("Error in AI processing:", error);
      throw error;
    }
  }

  async function fetchJobsAndRedirect(): Promise<void> {
    if (!applicationId) {
      setError("No application ID found");
      setLoading(false);
      return;
    }

    setLoadingText("Loading job experience details...");

    try {
      // Fetch all past jobs
      const { data } = await getApplicationAssociations({
        applicationId: applicationId,
        associationType: "PastJob",
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
          const { data: existingData } = await getApplicationAssociations({
            applicationId,
            associationType: "PastJob",
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
              // Perform AI processing
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
