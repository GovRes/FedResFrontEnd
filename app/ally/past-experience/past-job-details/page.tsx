"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PastJobQualificationType,
  PastJobType,
  TopicType,
} from "@/app/utils/responseSchemas";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { getApplicationAssociations } from "@/app/crud/application";
import styles from "@/app/components/ally/ally.module.css";
import { topicPastJobMatcher } from "@/app/components/aiProcessing/topicPastJobMatcher";
import {
  parallelBatchUpdatePastJobsWithQualifications,
  PastJobBatchUpdateType,
  updatePastJobWithQualifications,
} from "@/app/crud/pastJob";

// Define an interface for what getApplicationAssociations returns for PastJob
interface PastJobResponse {
  id: string;
  title: string;
  organization: string;
  startDate?: string;
  endDate?: string;
  hours?: string;
  gsLevel?: string;
  responsibilities?: string;
  userId: string;
  pastJobQualifications: PastJobQualificationType[];
  // other fields as needed
}

export default function PastJobsPage() {
  const [loading, setLoading] = useState(true);
  const [pastJobs, setPastJobs] = useState<PastJobType[]>([]);
  const router = useRouter();
  const { applicationId, job } = useApplication();

  // Fetch past jobs initially
  useEffect(() => {
    async function fetchPastJobs() {
      if (!applicationId) {
        return;
      }

      try {
        const pastJobsRes = (await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        })) as PastJobType[] | undefined;

        if (pastJobsRes && pastJobsRes.length > 0) {
          const formattedJobs = pastJobsRes.map(
            (job) =>
              ({
                ...job,
                pastJobQualifications: Array.isArray(job.pastJobQualifications)
                  ? job.pastJobQualifications
                  : [],
              } as PastJobType)
          );
          setPastJobs(formattedJobs);
        } else {
          console.log("No past jobs found");
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    }

    if (applicationId) {
      fetchPastJobs();
    }
  }, [applicationId]);

  // Process jobs with topics when both pastJobs and job.topics are available
  useEffect(() => {
    async function processJobsWithTopics() {
      if (!job?.topics?.length || !pastJobs.length) {
        setLoading(false);
        return [];
      }

      try {
        // 1. Find topics that aren't represented in any pastJobQualifications
        const missingTopics = findMissingTopics(job.topics, pastJobs);
        console.log(87, missingTopics);
        // 2. Find jobs that:
        // - Don't have any qualifications OR
        // - Have qualifications but those qualifications don't have topics
        const jobsNeedingTopics = pastJobs.filter((job) => {
          // Case 1: No qualifications at all
          if (
            !job.pastJobQualifications ||
            job.pastJobQualifications.length === 0
          ) {
            return true;
          }

          // Case 2: Has qualifications but at least one of them is missing a topic
          if (
            job.pastJobQualifications.some(
              (qual) => !qual.topic || !qual.topic.id
            )
          ) {
            return true;
          }

          return false;
        });
        console.log(111, jobsNeedingTopics);

        // Only proceed with matching if we have missing topics or jobs needing topics
        if (missingTopics.length > 0 || jobsNeedingTopics.length > 0) {
          // For jobs needing topics, match them with all topics
          if (jobsNeedingTopics.length > 0) {
            let res = await processJobsForTopics(jobsNeedingTopics, job.topics);
            let updateRes = await parallelBatchUpdatePastJobsWithQualifications(
              res
            );
          }

          // For remaining jobs with complete qualifications, match them with missing topics if any
          if (
            missingTopics.length > 0 &&
            pastJobs.length > jobsNeedingTopics.length
          ) {
            const remainingJobs = pastJobs.filter(
              (job) =>
                !jobsNeedingTopics.some(
                  (needingJob) => needingJob.id === job.id
                )
            );
            let resa = await processJobsForTopics(remainingJobs, missingTopics);
            let updateRes = await parallelBatchUpdatePastJobsWithQualifications(
              resa
            );
          }

          // After processing, fetch the updated pastJobs
          const updatedPastJobs = (await getApplicationAssociations({
            applicationId: applicationId as string,
            associationType: "PastJob",
          })) as PastJobResponse[] | undefined;
          console.log(141, updatedPastJobs);
          if (updatedPastJobs) {
            const formattedJobs = updatedPastJobs.map(
              (job) =>
                ({
                  ...job,
                  pastJobQualifications: Array.isArray(
                    job.pastJobQualifications
                  )
                    ? job.pastJobQualifications
                    : [],
                } as PastJobType)
            );
            console.log(154, formattedJobs);
            setPastJobs(formattedJobs);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error processing jobs with topics:", error);
        setLoading(false);
      }
    }

    if (pastJobs.length > 0 && job?.topics && job.topics.length > 0) {
      processJobsWithTopics();
    }
  }, [job?.topics, pastJobs, applicationId]);

  // Handle navigation to the appropriate job
  useEffect(() => {
    if (!loading && pastJobs.length > 0) {
      // First priority: Find jobs with missing or invalid topic references in qualifications
      const jobWithInvalidTopics = pastJobs.find((job) =>
        job.pastJobQualifications?.some((qual) => !qual.topic || !qual.topic.id)
      );

      // Second priority: Find jobs with unconfirmed qualifications
      const jobWithUnconfirmedQual = pastJobs.find((job) =>
        job.pastJobQualifications?.some((qual) => qual.userConfirmed === false)
      );

      // Third priority: Find jobs without any qualifications
      const jobWithoutQuals = pastJobs.find(
        (job) =>
          !job.pastJobQualifications || job.pastJobQualifications.length === 0
      );

      // Navigate based on priority
      if (jobWithInvalidTopics) {
        router.replace(
          `/ally/past-experience/past-job-details/${jobWithInvalidTopics.id}`
        );
      } else if (jobWithUnconfirmedQual) {
        router.replace(
          `/ally/past-experience/past-job-details/${jobWithUnconfirmedQual.id}`
        );
      } else if (jobWithoutQuals) {
        router.replace(
          `/ally/past-experience/past-job-details/${jobWithoutQuals.id}`
        );
      }
      // Otherwise, navigate to the first job
      else if (pastJobs[0]?.id) {
        router.replace(
          `/ally/past-experience/past-job-details/${pastJobs[0].id}`
        );
      }
    }
  }, [loading, pastJobs, router]);

  // Helper function to find topics that aren't represented in any pastJobQualifications
  function findMissingTopics(
    topics: TopicType[],
    pastJobs: PastJobType[]
  ): TopicType[] {
    // Get all topic titles from all pastJobQualifications across all jobs
    const coveredTopicTitles = new Set<string>();

    pastJobs.forEach((job) => {
      if (job.pastJobQualifications) {
        job.pastJobQualifications.forEach((qual) => {
          // Only consider qualifications that have a valid topic reference
          if (qual.topic && qual.topic.title) {
            coveredTopicTitles.add(qual.topic.title);
          }
        });
      }
    });

    // Return topics that aren't in the covered set
    return topics.filter((topic) => !coveredTopicTitles.has(topic.title));
  }

  // Helper function to process jobs for topics
  async function processJobsForTopics(
    jobsToProcess: PastJobType[],
    topicsToMatch: TopicType[]
  ) {
    if (jobsToProcess.length === 0 || topicsToMatch.length === 0) return;

    try {
      const processedJobs = await topicPastJobMatcher({
        pastJobs: jobsToProcess,
        topics: topicsToMatch,
      });
      console.log(247, processedJobs);

      const typedProcessedJobs = processedJobs.map((pastJob: any) => {
        // Ensure all qualifications have valid topics with non-empty IDs
        const validQualifications = Array.isArray(pastJob.pastJobQualifications)
          ? pastJob.pastJobQualifications.map(
              (qual: PastJobQualificationType) => {
                // If the topic has no ID or empty ID, replace it with a matching topic from the original list
                if (
                  !qual.topic ||
                  !qual.topic.id ||
                  qual.topic.id.trim() === ""
                ) {
                  // Find matching topic by title
                  const matchingTopic = topicsToMatch.find(
                    (t) => t.title === qual.title
                  );
                  if (matchingTopic) {
                    qual.topic = matchingTopic;
                  }
                }
                return qual;
              }
            )
          : [];

        return {
          pastJobId: pastJob.id,
          pastJobData: pastJob,
          pastJobQualifications: validQualifications,
        } as PastJobBatchUpdateType;
      });
      return typedProcessedJobs;
    } catch (error) {
      console.error("Error in processJobsForTopics:", error);
      throw error;
    }
  }

  if (loading) {
    return <TextBlinkLoader text="Loading past job experiences" />;
  }

  // This is just a fallback in case the redirect hasn't happened yet
  // or if there are no past jobs to redirect to
  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>Past Job Experience</h3>
      {pastJobs.length === 0 ? (
        <div className={styles.emptyStateContainer}>
          No past job experiences found. Please add some job experiences first.
        </div>
      ) : (
        <div className={styles.loadingContainer}>
          Redirecting to job details...
        </div>
      )}
    </div>
  );
}
