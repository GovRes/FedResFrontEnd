"use client";
import ExperiencePage from "@/app/ally/components/ExperiencePage";
import { topicPastJobMatcher } from "@/lib/aiProcessing/topicPastJobMatcher";
import {
  associateItemsWithApplication,
  getApplicationAssociations,
} from "@/lib/crud/application";
import { updatePastJobWithQualifications } from "@/lib/crud/pastJob";
import { useApplication } from "@/app/providers/applicationContext";
import { PastJobType, QualificationType } from "@/lib/utils/responseSchemas";
import { useEffect, useState } from "react";
import { Loader } from "@/app/components/loader/Loader";

export default function PastJobDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Loading past job details...");
  const {
    applicationId,
    job,
    isProcessingComplete,
    markProcessingComplete,
    steps,
  } = useApplication();
  useEffect(() => {
    console.log("=== STEP DEBUG ===");
    steps.forEach((step) => {
      console.log(
        `Step ${step.id}: completed=${step.completed}, disabled=${step.disabled}`
      );
    });
    console.log("==================");
  }, [steps]);
  useEffect(() => {
    async function fetchAndMatch(): Promise<void> {
      if (!applicationId) {
        setLoading(false);
        return;
      }

      // Check if processing has already been completed for past jobs
      if (isProcessingComplete("pastJobs")) {
        console.log("Past jobs processing already completed, skipping");
        setLoading(false);
        return;
      }

      // Check if we already have qualifications for this application's past jobs
      try {
        const { data } = await getApplicationAssociations({
          applicationId,
          associationType: "PastJob",
        });

        if (data && data.length > 0) {
          // Check if any job already has qualifications associated with this application
          const hasExistingQualifications = data.some((pastJob: PastJobType) =>
            pastJob.qualifications?.some((qual: any) =>
              qual.applicationIds?.includes(applicationId)
            )
          );

          if (hasExistingQualifications) {
            console.log(
              "Qualifications already exist for this application, marking as processed"
            );
            markProcessingComplete("pastJobs");
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Error checking existing qualifications:", error);
      }

      setLoading(true);
      console.log(
        "Starting past job processing for application:",
        applicationId
      );

      try {
        const { data } = await getApplicationAssociations({
          applicationId,
          associationType: "PastJob",
        });
        console.log("Fetched past jobs:", data);

        if (
          data &&
          data.length > 0 &&
          job &&
          job.topics &&
          job.topics.length > 0
        ) {
          let completedCount = 0;
          const totalTopics = job.topics.length;

          const topicPromises = job.topics.map(async (topic, index) => {
            console.log(40, topic);
            const topicMatcherData = await topicPastJobMatcher({
              topic,
              pastJobs: data,
            });
            console.log(44, topicMatcherData);
            console.log(
              `Topic matcher result for topic ${index + 1}/${totalTopics}:`,
              topicMatcherData
            );
            completedCount++;
            setLoadingText(
              `Processed ${completedCount}/${totalTopics} topics (${topic.title})`
            );
            return topicMatcherData;
          });

          const topicResults = await Promise.all(topicPromises);

          console.log("Topic matcher results:", topicResults);

          const allMatchedJobs: PastJobType[] = topicResults
            .flatMap((result) => {
              if (!result) return [];
              return Array.isArray(result) ? result : [result];
            })
            .filter((item): item is PastJobType => Boolean(item));

          console.log(
            "All matched jobs (with potential duplicates):",
            allMatchedJobs.length
          );

          // Process each job instance to create/update qualifications
          const processedJobs = new Map<string, any>();
          const allQualificationsToAssociate: QualificationType[] = [];

          const updatePromises: Promise<unknown>[] = allMatchedJobs.map(
            async (item: PastJobType, index: number) => {
              console.log(
                `Processing job instance ${index + 1}/${allMatchedJobs.length}:`,
                item.id
              );
              console.log(
                "Qualifications for this instance:",
                item.qualifications?.length || 0
              );

              if (item.qualifications && item.qualifications.length > 0) {
                console.log(
                  "Qualification IDs for job:",
                  item.qualifications.map(
                    (q: QualificationType) => q.id || "NO_ID"
                  )
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

                const updateResult = await updatePastJobWithQualifications(
                  item.id!,
                  item,
                  Array.isArray(item.qualifications)
                    ? item.qualifications
                    : undefined
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
                if (
                  updatedPastJob?.qualifications?.items &&
                  updatedPastJob.qualifications.items.length > 0
                ) {
                  const qualificationObjects =
                    updatedPastJob.qualifications.items
                      .map((qualItem: any) => {
                        if (!qualItem.qualification) {
                          console.warn(
                            `Qualification item missing qualification data:`,
                            qualItem
                          );
                          return null;
                        }
                        return {
                          id: qualItem.qualification.id,
                          title: qualItem.qualification.title,
                          description: qualItem.qualification.description,
                          paragraph: qualItem.qualification.paragraph,
                          question: qualItem.qualification.question,
                          userConfirmed: qualItem.qualification.userConfirmed,
                          topicId: qualItem.qualification.topicId,
                          userId: qualItem.qualification.userId,
                          topic: qualItem.qualification.topic,
                        };
                      })
                      .filter(Boolean);

                  console.log(
                    `Extracted ${qualificationObjects.length} qualification objects from job ${item.id}`
                  );

                  if (!processedJobs.has(item.id!)) {
                    processedJobs.set(item.id!, new Set());
                  }

                  const jobQualifications = processedJobs.get(item.id!);
                  qualificationObjects.forEach((qual: QualificationType) => {
                    if (!jobQualifications.has(qual.id)) {
                      jobQualifications.add(qual.id);
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

          const processedResults = await Promise.all(updatePromises);
          const validResults = processedResults.filter(Boolean);

          console.log(
            `Processed ${validResults.length} job instances successfully`
          );
          console.log(
            `Total unique qualifications to associate: ${allQualificationsToAssociate.length}`
          );

          if (allQualificationsToAssociate.length > 0) {
            console.log(
              "Qualification IDs to associate with application:",
              allQualificationsToAssociate.map((q) => q.id)
            );

            try {
              const associationResult = await associateItemsWithApplication({
                applicationId,
                items: allQualificationsToAssociate,
                associationType: "Qualification",
              });

              if (associationResult.success) {
                const createdCount = associationResult.data?.length || 0;
                console.log(
                  `Successfully associated ${createdCount} qualifications with application`
                );

                if (associationResult.error) {
                  console.warn(
                    `Association completed with warnings: ${associationResult.error}`
                  );
                }
              } else {
                console.error(
                  `Failed to associate qualifications with application: ${associationResult.error}`
                );
              }
            } catch (error) {
              console.error("Error during qualification association:", error);
            }
          } else {
            console.log("No qualifications to associate with application");
          }

          console.log("Completed processing all matched jobs");

          // Mark processing as completed
          markProcessingComplete("pastJobs");
        } else {
          // No past jobs or topics found, still mark as processed to avoid future attempts
          console.log("No past jobs or topics found, marking as processed");
          markProcessingComplete("pastJobs");
        }
      } catch (error) {
        console.error("Error in fetchAndMatch:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAndMatch();
  }, [applicationId, job, isProcessingComplete, markProcessingComplete]);

  if (loading) return <Loader text={loadingText} />;
  return <ExperiencePage currentStepId="past-job-details" type="PastJob" />;
}
