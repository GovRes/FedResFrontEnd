// Create this as experienceProcessor.ts in an appropriate utils directory

import {
  ExperienceType,
  ExperienceBatchUpdateType,
  ExperienceConfig,
  EXPERIENCE_CONFIGS,
} from "@/app/utils/responseSchemas";
import { TopicType } from "@/app/utils/responseSchemas";
import { getApplicationAssociations } from "@/app/crud/application";
import { topicPastJobMatcher } from "../components/aiProcessing/topicPastJobMatcher";
import { batchUpdateExperiencesWithQualifications } from "../crud/pastJob";

// // Generic function to match topics to experiences (pastJobs or volunteers)
// export async function matchTopicsToExperience({
//   experiences,
//   topics,
//   experienceType,
// }: {
//   experiences: ExperienceType[];
//   topics: TopicType[];
//   experienceType: "PastJob" | "Volunteer";
// }) {
//   try {
//     const endpoint =
//       experienceType === "PastJob"
//         ? "/ai/match-pastjob-topics"
//         : "/ai/match-volunteer-topics";

//     const requestPayload =
//       experienceType === "PastJob"
//         ? { pastJobs: experiences, topics }
//         : { volunteers: experiences, topics };

//     const response = await axiosClient.post(endpoint, requestPayload);
//     return response.data;
//   } catch (error) {
//     console.error(
//       `Error matching topics to ${experienceType.toLowerCase()} experiences:`,
//       error
//     );
//     throw error;
//   }
// }

// Generic function to update experience with qualifications
// export async function updateExperienceWithQualifications({
//   experienceId,
//   experienceData,
//   qualifications,
//   experienceType,
// }: {
//   experienceId: string;
//   experienceData: ExperienceType;
//   qualifications: any[];
//   experienceType: "PastJob" | "Volunteer";
// }) {
//   try {
//     const config = EXPERIENCE_CONFIGS[experienceType];
//     const endpoint = `${config.apiEndpoint}/${experienceId}/qualifications`;

//     // Create the correct payload structure based on experience type
//     const payload =
//       experienceType === "PastJob"
//         ? { pastJobData: experienceData, pastJobQualifications: qualifications }
//         : {
//             volunteerData: experienceData,
//             volunteerQualifications: qualifications,
//           };

//     const response = await axiosClient.put(endpoint, payload);
//     return response.data;
//   } catch (error) {
//     console.error(
//       `Error updating ${experienceType.toLowerCase()} with qualifications:`,
//       error
//     );
//     throw error;
//   }
// }

// Generic function for batch updates
// export async function batchUpdateExperiencesWithQualifications(
//   updates: ExperienceBatchUpdateType[]
// ) {
//   try {
//     // Group updates by experience type
//     const groupedUpdates = updates.reduce((acc, update) => {
//       if (!acc[update.experienceType]) {
//         acc[update.experienceType] = [];
//       }
//       acc[update.experienceType].push(update);
//       return acc;
//     }, {} as Record<string, ExperienceBatchUpdateType[]>);

//     // Process each group in parallel
//     const allPromises: Promise<any>[] = [];

//     for (const [experienceType, typeUpdates] of Object.entries(
//       groupedUpdates
//     )) {
//       const config = EXPERIENCE_CONFIGS[experienceType];

//       // Transform each update to the correct format
//       const updatePromises = typeUpdates.map((update) => {
//         const payload = {
//           [config.idKey]: update.experienceId,
//           [`${experienceType.toLowerCase()}Data`]: update.experienceData,
//           [config.qualificationsKey]: update.qualifications,
//         };

//         return updateExperienceWithQualifications({
//           experienceId: update.experienceId,
//           experienceData: update.experienceData,
//           qualifications: update.qualifications,
//           experienceType: experienceType as "PastJob" | "Volunteer",
//         });
//       });

//       allPromises.push(...updatePromises);
//     }

//     // Execute all promises in parallel
//     const results = await Promise.allSettled(allPromises);
//     return results;
//   } catch (error) {
//     console.error("Error in batch update experiences:", error);
//     throw error;
//   }
// }

// Generic function to find missing topics across all experiences
export function findMissingTopics(
  topics: TopicType[],
  experiences: ExperienceType[],
  qualificationsKey: string
): TopicType[] {
  // Get all topic titles from all qualifications across all experiences
  const coveredTopicTitles = new Set<string>();

  experiences.forEach((experience) => {
    if (experience[qualificationsKey]) {
      experience[qualificationsKey].forEach((qual: any) => {
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

// Helper function to find experiences needing topics
export function findExperiencesNeedingTopics(
  experiences: ExperienceType[],
  qualificationsKey: string
): ExperienceType[] {
  return experiences.filter((experience) => {
    // Case 1: No qualifications at all
    if (
      !experience[qualificationsKey] ||
      experience[qualificationsKey].length === 0
    ) {
      return true;
    }

    // Case 2: Has qualifications but at least one of them is missing a topic
    if (
      experience[qualificationsKey].some(
        (qual: any) => !qual.topic || !qual.topic.id
      )
    ) {
      return true;
    }

    return false;
  });
}

// Function to process experiences and match them with topics
export async function processExperiencesWithTopics({
  applicationId,
  experiences,
  topics,
  experienceType,
  setExperiences,
}: {
  applicationId: string;
  experiences: ExperienceType[];
  topics: TopicType[];
  experienceType: "PastJob" | "Volunteer";
  setExperiences: (experiences: ExperienceType[]) => void;
}) {
  const config = EXPERIENCE_CONFIGS[experienceType];

  if (!topics?.length || !experiences.length) {
    return [];
  }

  try {
    // 1. Find topics that aren't represented in any qualifications
    const missingTopics = findMissingTopics(
      topics,
      experiences,
      config.qualificationsKey
    );

    // 2. Find experiences that need topics
    const experiencesNeedingTopics = findExperiencesNeedingTopics(
      experiences,
      config.qualificationsKey
    );

    // Only proceed with matching if we have missing topics or experiences needing topics
    if (missingTopics.length > 0 || experiencesNeedingTopics.length > 0) {
      // For experiences needing topics, match them with all topics
      if (experiencesNeedingTopics.length > 0) {
        const processedExperiences = await topicPastJobMatcher({
          pastJobs: experiencesNeedingTopics,
          topics: missingTopics,
        });

        // Transform the processed experiences to the batch update format
        const updates = processedExperiences.map((exp: any) => {
          const qualifications = Array.isArray(exp[config.qualificationsKey])
            ? exp[config.qualificationsKey].map((qual: any) => {
                // If topic is missing or has empty ID, try to find a matching topic
                if (
                  !qual.topic ||
                  !qual.topic.id ||
                  qual.topic.id.trim() === ""
                ) {
                  const matchingTopic = topics.find(
                    (t) => t.title === qual.title
                  );
                  if (matchingTopic) {
                    qual.topic = matchingTopic;
                  }
                }
                return qual;
              })
            : [];

          return {
            experienceId: exp.id,
            experienceData: exp,
            qualifications,
            experienceType,
          } as ExperienceBatchUpdateType;
        });

        await batchUpdateExperiencesWithQualifications(updates);
      }

      // For remaining experiences with complete qualifications, match them with missing topics if any
      if (
        missingTopics.length > 0 &&
        experiences.length > experiencesNeedingTopics.length
      ) {
        const remainingExperiences = experiences.filter(
          (exp) =>
            !experiencesNeedingTopics.some(
              (needingExp) => needingExp.id === exp.id
            )
        );

        const processedExperiences = await matchTopicsToExperience({
          experiences: remainingExperiences,
          topics: missingTopics,
          experienceType,
        });

        // Transform the processed experiences to the batch update format
        const updates = processedExperiences.map((exp: any) => {
          const qualifications = Array.isArray(exp[config.qualificationsKey])
            ? exp[config.qualificationsKey].map((qual: any) => {
                if (
                  !qual.topic ||
                  !qual.topic.id ||
                  qual.topic.id.trim() === ""
                ) {
                  const matchingTopic = missingTopics.find(
                    (t) => t.title === qual.title
                  );
                  if (matchingTopic) {
                    qual.topic = matchingTopic;
                  }
                }
                return qual;
              })
            : [];

          return {
            experienceId: exp.id,
            experienceData: exp,
            qualifications,
            experienceType,
          } as ExperienceBatchUpdateType;
        });

        await batchUpdateExperiencesWithQualifications(
          updates,
          experienceType,
          3
        );
      }

      // After processing, fetch the updated experiences
      const updatedExperiences = await getApplicationAssociations({
        applicationId,
        associationType: config.associationType,
      });

      if (updatedExperiences) {
        const formattedExperiences = updatedExperiences.map((exp) => ({
          ...exp,
          [config.qualificationsKey]: Array.isArray(
            exp[config.qualificationsKey]
          )
            ? exp[config.qualificationsKey]
            : [],
        }));

        setExperiences(formattedExperiences);
      }
    }
  } catch (error) {
    console.error(
      `Error processing ${experienceType.toLowerCase()} with topics:`,
      error
    );
    throw error;
  }
}

// Navigation helper for finding the next experience to navigate to
export function findNextExperienceToNavigate(
  experiences: ExperienceType[],
  config: ExperienceConfig,
  router: any
) {
  if (!experiences || experiences.length === 0) return;

  // First priority: Find experiences with missing or invalid topic references in qualifications
  const experienceWithInvalidTopics = experiences.find((exp) =>
    exp[config.qualificationsKey]?.some(
      (qual: any) => !qual.topic || !qual.topic.id
    )
  );

  // Second priority: Find experiences with unconfirmed qualifications
  const experienceWithUnconfirmedQual = experiences.find((exp) =>
    exp[config.qualificationsKey]?.some(
      (qual: any) => qual.userConfirmed === false
    )
  );

  // Third priority: Find experiences without any qualifications
  const experienceWithoutQuals = experiences.find(
    (exp) =>
      !exp[config.qualificationsKey] ||
      exp[config.qualificationsKey].length === 0
  );

  // Navigate based on priority
  if (experienceWithInvalidTopics) {
    router.replace(`${config.routePrefix}/${experienceWithInvalidTopics.id}`);
  } else if (experienceWithUnconfirmedQual) {
    router.replace(`${config.routePrefix}/${experienceWithUnconfirmedQual.id}`);
  } else if (experienceWithoutQuals) {
    router.replace(`${config.routePrefix}/${experienceWithoutQuals.id}`);
  }
  // Otherwise, navigate to the first experience
  else if (experiences[0]?.id) {
    router.replace(`${config.routePrefix}/${experiences[0].id}`);
  }
}

// Reusable function for finding the next unconfirmed experience
export function navigateToNextUnconfirmedExperience(
  currentIndex: number,
  experiences: ExperienceType[],
  qualificationsKey: string,
  routePrefix: string,
  router: any
) {
  if (experiences.length === 0) return;

  // Start searching from current index + 1
  const startIndex =
    currentIndex + 1 < experiences.length ? currentIndex + 1 : 0;

  // Check each experience starting from the next one
  for (let i = 0; i < experiences.length; i++) {
    const index = (startIndex + i) % experiences.length;
    const experience = experiences[index];

    if (
      experience[qualificationsKey]?.some(
        (qual: any) => qual.userConfirmed === false
      )
    ) {
      router.push(`${routePrefix}/${experience.id}`);
      return;
    }
  }
}
