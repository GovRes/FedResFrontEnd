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

export default function VolunteerDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState(
    "Loading volunteer experience details..."
  );
  const { applicationId, job, isProcessingComplete, markProcessingComplete } =
    useApplication();

  useEffect(() => {
    async function fetchAndMatch(): Promise<void> {
      if (!applicationId) {
        setLoading(false);
        return;
      }

      // Check if processing has already been completed for volunteer experiences
      if (isProcessingComplete("volunteer")) {
        console.log(
          "Volunteer experience processing already completed, skipping"
        );
        setLoading(false);
        return;
      }

      // Check if we already have qualifications for this application's volunteer experiences
      try {
        const { data } = await getApplicationAssociations({
          applicationId,
          associationType: "PastJob",
        });

        if (data && data.length > 0) {
          // Check if any volunteer experience already has qualifications associated with this application
          const hasExistingQualifications = data.some(
            (volunteer: PastJobType) =>
              volunteer.qualifications?.some((qual: any) =>
                qual.applicationIds?.includes(applicationId)
              )
          );

          if (hasExistingQualifications) {
            console.log(
              "Volunteer qualifications already exist for this application, marking as processed"
            );
            markProcessingComplete("volunteer");
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error(
          "Error checking existing volunteer qualifications:",
          error
        );
      }

      setLoading(true);
      console.log(
        "Starting volunteer experience processing for application:",
        applicationId
      );

      try {
        const { data } = await getApplicationAssociations({
          applicationId,
          associationType: "PastJob",
        });
        console.log("Fetched volunteer experiences:", data);

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
            console.log("Processing topic for volunteers:", topic);
            const topicMatcherData = await topicPastJobMatcher({
              topic,
              pastJobs: data, // This works for volunteer experiences too since they use the same structure
            });
            console.log("Volunteer topic matcher result:", topicMatcherData);
            console.log(
              `Volunteer topic matcher result for topic ${index + 1}/${totalTopics}:`,
              topicMatcherData
            );
            completedCount++;
            setLoadingText(
              `Processed ${completedCount}/${totalTopics} topics (${topic.title})`
            );
            return topicMatcherData;
          });

          const topicResults = await Promise.all(topicPromises);

          console.log("Volunteer topic matcher results:", topicResults);

          const allMatchedVolunteers: PastJobType[] = topicResults
            .flatMap((result) => {
              if (!result) return [];
              return Array.isArray(result) ? result : [result];
            })
            .filter((item): item is PastJobType => Boolean(item));

          console.log(
            "All matched volunteer experiences (with potential duplicates):",
            allMatchedVolunteers.length
          );

          // Process each volunteer experience instance to create/update qualifications
          const processedVolunteers = new Map<string, any>();
          const allQualificationsToAssociate: QualificationType[] = [];

          const updatePromises: Promise<unknown>[] = allMatchedVolunteers.map(
            async (item: PastJobType, index: number) => {
              console.log(
                `Processing volunteer instance ${index + 1}/${allMatchedVolunteers.length}:`,
                item.id
              );
              console.log(
                "Qualifications for this volunteer instance:",
                item.qualifications?.length || 0
              );

              if (item.qualifications && item.qualifications.length > 0) {
                console.log(
                  "Qualification IDs for volunteer:",
                  item.qualifications.map(
                    (q: QualificationType) => q.id || "NO_ID"
                  )
                );
                console.log(
                  "Qualification titles for volunteer:",
                  item.qualifications.map(
                    (q: QualificationType) => q.title || "NO_TITLE"
                  )
                );
              }

              if (!item.qualifications || item.qualifications.length === 0) {
                console.log(
                  `Skipping volunteer ${item.id} instance ${index} as it has no qualifications`
                );
                return null;
              }

              try {
                console.log(
                  `Updating volunteer experience ${item.id} with ${item.qualifications.length} qualifications`
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
                    `Failed to update volunteer experience: ${updateResult.error}`
                  );
                }

                console.log(
                  `Successfully updated volunteer ${item.id} with qualifications`
                );

                const updatedVolunteer = updateResult.data;
                if (
                  updatedVolunteer?.qualifications?.items &&
                  updatedVolunteer.qualifications.items.length > 0
                ) {
                  const qualificationObjects =
                    updatedVolunteer.qualifications.items
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
                    `Extracted ${qualificationObjects.length} qualification objects from volunteer ${item.id}`
                  );

                  if (!processedVolunteers.has(item.id!)) {
                    processedVolunteers.set(item.id!, new Set());
                  }

                  const volunteerQualifications = processedVolunteers.get(
                    item.id!
                  );
                  qualificationObjects.forEach((qual: QualificationType) => {
                    if (!volunteerQualifications.has(qual.id)) {
                      volunteerQualifications.add(qual.id);
                      allQualificationsToAssociate.push(qual);
                    }
                  });

                  return qualificationObjects;
                } else {
                  console.warn(
                    `No qualifications found in updated volunteer ${item.id} response`
                  );
                  return null;
                }
              } catch (error) {
                console.error(
                  `Failed to process volunteer ${item.id} instance ${index}:`,
                  error
                );
                return null;
              }
            }
          );

          const processedResults = await Promise.all(updatePromises);
          const validResults = processedResults.filter(Boolean);

          console.log(
            `Processed ${validResults.length} volunteer instances successfully`
          );
          console.log(
            `Total unique volunteer qualifications to associate: ${allQualificationsToAssociate.length}`
          );

          if (allQualificationsToAssociate.length > 0) {
            console.log(
              "Volunteer qualification IDs to associate with application:",
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
                  `Successfully associated ${createdCount} volunteer qualifications with application`
                );

                if (associationResult.error) {
                  console.warn(
                    `Volunteer association completed with warnings: ${associationResult.error}`
                  );
                }
              } else {
                console.error(
                  `Failed to associate volunteer qualifications with application: ${associationResult.error}`
                );
              }
            } catch (error) {
              console.error(
                "Error during volunteer qualification association:",
                error
              );
            }
          } else {
            console.log(
              "No volunteer qualifications to associate with application"
            );
          }

          console.log("Completed processing all matched volunteer experiences");

          // Mark processing as completed
          markProcessingComplete("volunteer");
        } else {
          // No volunteer experiences or topics found, still mark as processed to avoid future attempts
          console.log(
            "No volunteer experiences or topics found, marking as processed"
          );
          markProcessingComplete("volunteer");
        }
      } catch (error) {
        console.error("Error in volunteer fetchAndMatch:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAndMatch();
  }, [applicationId, job, isProcessingComplete, markProcessingComplete]);

  if (loading) return <Loader text={loadingText} />;
  return <ExperiencePage currentStepId="volunteer-details" type="Volunteer" />;
}
