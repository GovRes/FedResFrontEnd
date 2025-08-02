import { generateClient } from "aws-amplify/api";
import { v4 as uuidv4 } from "uuid";
import { updateModelRecord } from "./genericUpdate";
import { QualificationType, PastJobType } from "../utils/responseSchemas";

/**
 * Batch version to update multiple PastJob records including their qualifications
 *
 * @param {Array<Object>} pastJobUpdates - Array of objects containing pastJob update information
 * @param {string} pastJobUpdates[].pastJobId - The ID of the PastJob to update
 * @param {Object} pastJobUpdates[].pastJobData - The PastJob data to update
 * @param {Array} pastJobUpdates[].qualifications - Array of qualification objects to associate with the PastJob
 * @returns {Promise<Array<Object>>} - Array of updated PastJob data with relationships
 */
export async function batchUpdatePastJobsWithQualifications(
  pastJobUpdates: Array<PastJobType>
) {
  const client = generateClient();
  const results = [];
  const errors = [];

  // Process each update in sequence to avoid overwhelming the API
  for (const update of pastJobUpdates) {
    if (update.id) {
      try {
        // Use the existing single-job update function for each job
        const updatedPastJob = await updatePastJobWithQualifications(
          update.id,
          update,
          Array.isArray(update.qualifications)
            ? update.qualifications
            : undefined
        );

        results.push({
          pastJobId: update.id,
          success: true,
          data: updatedPastJob,
        });
      } catch (error) {
        console.error(`Error updating PastJob ${update.id}:`, error);
        errors.push({
          pastJobId: update.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add to results array with error information
        results.push({
          pastJobId: update.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // Return comprehensive results including both successful updates and failures
  return {
    results,
    summary: {
      total: pastJobUpdates.length,
      successful: results.filter((r) => r.success).length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : null,
    },
  };
}

/**
 * Batch version to update multiple PastJob records with parallel processing
 * Use with caution as it may cause API rate limiting issues
 *
 * @param {Array<Object>} pastJobUpdates - Array of objects containing pastJob update information
 * @param {string} pastJobUpdates[].pastJobId - The ID of the PastJob to update
 * @param {Object} pastJobUpdates[].pastJobData - The PastJob data to update
 * @param {Array} pastJobUpdates[].qualifications - Array of qualification objects to associate with the PastJob
 * @param {number} batchSize - Optional maximum number of parallel operations (default: 3)
 * @returns {Promise<Array<Object>>} - Array of updated PastJob data with relationships
 */
export type PastJobBatchUpdateType = {
  pastJobId: string;
  pastJobData: PastJobType;
  qualifications?: QualificationType[];
};
export async function parallelBatchUpdatePastJobsWithQualifications(
  pastJobUpdates: PastJobBatchUpdateType[],
  batchSize = 3
) {
  const results = [];
  const errors: { pastJobId: string; success: boolean; error: string }[] = [];

  // Process updates in batches to avoid overwhelming the API
  for (let i = 0; i < pastJobUpdates.length; i += batchSize) {
    const batch = pastJobUpdates.slice(i, i + batchSize);

    // Run updates in this batch in parallel
    const batchPromises = batch.map(async (update) => {
      try {
        const { pastJobId, pastJobData, qualifications } = update;

        const updatedPastJob = await updatePastJobWithQualifications(
          pastJobId,
          pastJobData,
          qualifications
        );

        return {
          pastJobId,
          success: true,
          data: updatedPastJob,
        };
      } catch (error) {
        console.error(`Error updating PastJob ${update.pastJobId}:`, error);
        errors.push({
          pastJobId: update.pastJobId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          pastJobId: update.pastJobId,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // Wait for all updates in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // Return comprehensive results including both successful updates and failures
  return {
    results,
    summary: {
      total: pastJobUpdates.length,
      successful: results.filter((r) => r.success).length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : null,
    },
  };
}

/**
 * Helper function to check if two qualifications are essentially the same
 * Based on title and description similarity
 */
function areQualificationsSimilar(qual1: any, qual2: any): boolean {
  // Simple similarity check - you might want to make this more sophisticated
  const title1 = (qual1.title || "").toLowerCase().trim();
  const title2 = (qual2.title || "").toLowerCase().trim();
  const desc1 = (qual1.description || "").toLowerCase().trim();
  const desc2 = (qual2.description || "").toLowerCase().trim();

  // Check if titles are identical or very similar
  const titlesMatch = title1 === title2;

  // Check if descriptions are identical or very similar
  const descriptionsMatch = desc1 === desc2;

  return titlesMatch && descriptionsMatch;
}

/**
 * Specialized function to update a PastJob record including its qualifications
 * This function will ADD new qualifications without removing existing ones
 *
 * @param {string} pastJobId - The ID of the PastJob to update
 * @param {Object} pastJobData - The PastJob data to update
 * @param {Array} qualifications - Array of qualification objects to associate with the PastJob
 * @returns {Promise<Object>} - The updated PastJob data with relationships
 */
export async function updatePastJobWithQualifications(
  pastJobId: string,
  pastJobData: any,
  qualifications?: Array<any>
) {
  const client = generateClient();

  try {
    // First, extract qualifications from the data if they exist
    const { qualifications: qualificationsFromData, ...cleanPastJobData } =
      pastJobData;
    // Use qualifications from the separate parameter or from the data object
    const qualificationsToUse = qualifications || qualificationsFromData || [];

    // 1. Update the basic PastJob record first
    const updatedPastJob = await updateModelRecord(
      "PastJob",
      pastJobId,
      cleanPastJobData
    );

    if (qualificationsToUse && qualificationsToUse.length > 0) {
      // 2. Fetch existing qualification relationships
      const listExistingRelationshipsQuery = `
        query ListPastJobQualifications($pastJobId: ID!) {
          listPastJobQualifications(filter: {pastJobId: {eq: $pastJobId}}) {
            items {
              id
              pastJobId
              qualificationId
              qualification {
                id
                title
                description
                paragraph
                question
                userConfirmed
                topicId
                userId
              }
            }
          }
        }
      `;

      const existingRelationshipsResult = await client.graphql({
        query: listExistingRelationshipsQuery,
        variables: {
          pastJobId: pastJobId,
        },
        authMode: "userPool",
      });

      const existingRelationships =
        (existingRelationshipsResult as any).data?.listPastJobQualifications
          ?.items || [];

      // Create a map of existing qualifications for similarity checking
      const existingQualifications = existingRelationships.map(
        (rel: any) => rel.qualification
      );

      // 3. Process each new qualification
      for (const qualification of qualificationsToUse) {
        try {
          // Check if this qualification is similar to any existing one
          const similarExisting = existingQualifications.find((existing: any) =>
            areQualificationsSimilar(qualification, existing)
          );

          if (similarExisting) {
            continue; // Skip this qualification as it's too similar to an existing one
          }

          // Generate ID if not present
          if (!qualification.id) {
            qualification.id = uuidv4();
          }

          // Check if the qualification exists directly in the database
          const getQualificationQuery = `
            query GetQualification($id: ID!) {
              getQualification(id: $id) {
                id
              }
            }
          `;

          const existingQualResult = await client.graphql({
            query: getQualificationQuery,
            variables: {
              id: qualification.id,
            },
            authMode: "userPool",
          });

          const existingQualification = (existingQualResult as any).data
            ?.getQualification;
          const qualificationExists = !!existingQualification;

          // Prepare the qualification input with safe defaults
          const qualificationInput = {
            id: qualification.id,
            title: qualification.title || "",
            description: qualification.description || "",
            paragraph: qualification.paragraph || "",
            question: qualification.question || "",
            userConfirmed: qualification.userConfirmed || false,
            topicId: qualification.topic?.id || "",
            userId: pastJobData.userId,
          };

          // Create or update the qualification
          if (qualificationExists) {
            // Update existing qualification
            const updateQualificationMutation = `
              mutation UpdateQualification($input: UpdateQualificationInput!) {
                updateQualification(input: $input) {
                  id
                }
              }
            `;

            await client.graphql({
              query: updateQualificationMutation,
              variables: {
                input: qualificationInput,
              },
              authMode: "userPool",
            });
          } else {
            // Create new qualification
            const createQualificationMutation = `
              mutation CreateQualification($input: CreateQualificationInput!) {
                createQualification(input: $input) {
                  id
                }
              }
            `;

            await client.graphql({
              query: createQualificationMutation,
              variables: {
                input: qualificationInput,
              },
              authMode: "userPool",
            });
          }

          // Then ensure the join table entry exists
          // Check if the join already exists
          const checkJoinQuery = `
            query ListPastJobQualifications($filter: ModelPastJobQualificationFilterInput) {
              listPastJobQualifications(filter: $filter) {
                items {
                  id
                }
              }
            }
          `;

          const joinCheckResult = await client.graphql({
            query: checkJoinQuery,
            variables: {
              filter: {
                and: [
                  { pastJobId: { eq: pastJobId } },
                  { qualificationId: { eq: qualification.id } },
                ],
              },
            },
            authMode: "userPool",
          });

          const existingJoins =
            (joinCheckResult as any).data?.listPastJobQualifications?.items ||
            [];

          // Create the join if it doesn't exist
          if (existingJoins.length === 0) {
            const createJoinMutation = `
              mutation CreatePastJobQualification($input: CreatePastJobQualificationInput!) {
                createPastJobQualification(input: $input) {
                  id
                }
              }
            `;

            const joinInput = {
              id: uuidv4(),
              pastJobId: pastJobId,
              qualificationId: qualification.id,
            };

            await client.graphql({
              query: createJoinMutation,
              variables: {
                input: joinInput,
              },
              authMode: "userPool",
            });
          } else {
            console.log(
              `Join entry already exists for qualification ${qualification.id}`
            );
          }
        } catch (error) {
          console.error(
            `Error processing qualification ${qualification.id}:`,
            error,
            "Qualification data:",
            JSON.stringify(qualification, null, 2),
            "Error details:",
            error instanceof Error ? error.stack : "No stack trace"
          );
          // Continue with the next qualification rather than failing the entire operation
        }
      }
    }

    // 4. Fetch the updated PastJob with its relationships
    const getPastJobQuery = `
      query GetPastJob($id: ID!) {
        getPastJob(id: $id) {
          id
          title
          organization
          organizationAddress
          startDate
          endDate
          hours
          gsLevel
          responsibilities
          supervisorName
          supervisorPhone
          supervisorMayContact
          type
          userId
          createdAt
          updatedAt
          qualifications {
            items {
              id
              qualificationId
              qualification {
                id
                title
                description
                paragraph
                question
                userConfirmed
                topicId
                topic {
                  id
                  title
                  keywords
                  description
                  evidence
                 
                }
                userId
              }
            }
          }
        }
      }
    `;

    const result = await client.graphql({
      query: getPastJobQuery,
      variables: {
        id: pastJobId,
      },
      authMode: "userPool",
    });

    // Check if the result is a GraphQLResult type with data
    if ("data" in result) {
      const pastJob = result.data?.getPastJob;
      const qualificationCount = pastJob?.qualifications?.items?.length || 0;
      return pastJob;
    }

    return null;
  } catch (error) {
    console.error("Error updating PastJob with qualifications:", error);
    throw error;
  }
}
