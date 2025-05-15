import { generateClient } from "aws-amplify/api";
import { v4 as uuidv4 } from "uuid";
import { updateModelRecord } from "./genericUpdate";
import {
  PastJobQualificationType,
  PastJobType,
} from "../utils/responseSchemas";

/**
 * Batch version to update multiple PastJob records including their pastJobQualifications
 *
 * @param {Array<Object>} pastJobUpdates - Array of objects containing pastJob update information
 * @param {string} pastJobUpdates[].pastJobId - The ID of the PastJob to update
 * @param {Object} pastJobUpdates[].pastJobData - The PastJob data to update
 * @param {Array} pastJobUpdates[].pastJobQualifications - Array of pastJobQualification objects to associate with the PastJob
 * @returns {Promise<Array<Object>>} - Array of updated PastJob data with relationships
 */
export async function batchUpdatePastJobsWithQualifications(
  pastJobUpdates: Array<{
    pastJobId: string;
    pastJobData: any;
    pastJobQualifications?: Array<any>;
  }>
) {
  const client = generateClient();
  const results = [];
  const errors = [];

  // Process each update in sequence to avoid overwhelming the API
  for (const update of pastJobUpdates) {
    try {
      const { pastJobId, pastJobData, pastJobQualifications } = update;

      // Use the existing single-job update function for each job
      const updatedPastJob = await updatePastJobWithQualifications(
        pastJobId,
        pastJobData,
        pastJobQualifications
      );

      results.push({
        pastJobId,
        success: true,
        data: updatedPastJob,
      });
    } catch (error) {
      console.error(`Error updating PastJob ${update.pastJobId}:`, error);
      errors.push({
        pastJobId: update.pastJobId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      // Add to results array with error information
      results.push({
        pastJobId: update.pastJobId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
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
 * @param {Array} pastJobUpdates[].pastJobQualifications - Array of pastJobQualification objects to associate with the PastJob
 * @param {number} batchSize - Optional maximum number of parallel operations (default: 3)
 * @returns {Promise<Array<Object>>} - Array of updated PastJob data with relationships
 */
export type PastJobBatchUpdateType = {
  pastJobId: string;
  pastJobData: PastJobType;
  pastJobQualifications?: PastJobQualificationType[];
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
        const { pastJobId, pastJobData, pastJobQualifications } = update;

        const updatedPastJob = await updatePastJobWithQualifications(
          pastJobId,
          pastJobData,
          pastJobQualifications
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
 * Specialized function to update a PastJob record including its pastJobQualifications
 *
 * @param {string} pastJobId - The ID of the PastJob to update
 * @param {Object} pastJobData - The PastJob data to update
 * @param {Array} pastJobQualifications - Array of pastJobQualification objects to associate with the PastJob
 * @returns {Promise<Object>} - The updated PastJob data with relationships
 */
export async function updatePastJobWithQualifications(
  pastJobId: string,
  pastJobData: any,
  pastJobQualifications?: Array<any>
) {
  const client = generateClient();

  try {
    // First, extract pastJobQualifications from the data if they exist
    const {
      pastJobQualifications: qualificationsFromData,
      ...cleanPastJobData
    } = pastJobData;
    // Use qualifications from the separate parameter or from the data object
    const qualifications =
      pastJobQualifications || qualificationsFromData || [];

    // 1. Update the basic PastJob record first
    const updatedPastJob = await updateModelRecord(
      "PastJob",
      pastJobId,
      cleanPastJobData
    );

    if (qualifications && qualifications.length > 0) {
      // 2. Fetch existing pastJobQualification relationships
      const listExistingRelationshipsQuery = `
        query ListPastJobPastJobQualifications($pastJobId: ID!) {
          listPastJobPastJobQualifications(filter: {pastJobId: {eq: $pastJobId}}) {
            items {
              id
              pastJobId
              pastJobQualificationId
              pastJobQualification {
                id
                title
                description
                paragraph
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
        (existingRelationshipsResult as any).data
          ?.listPastJobPastJobQualifications?.items || [];

      // Create a map of existing qualification IDs for faster lookups
      const existingQualificationIds = new Set(
        existingRelationships.map((rel: any) => rel.pastJobQualificationId)
      );

      // Create a map of existing relationships by qualification ID for faster lookups
      const existingRelationshipsMap = existingRelationships.reduce(
        (map: any, rel: any) => {
          map[rel.pastJobQualificationId] = rel;
          return map;
        },
        {}
      );

      // 3. Process each qualification
      for (const qualification of qualifications) {
        try {
          // Check if the qualification exists
          if (!existingQualificationIds.has(qualification.id)) {
            // Make sure qualification has a proper ID
            if (!qualification.id) {
              qualification.id = uuidv4();
            }

            // First, check if the PastJobQualification already exists
            const getQualificationQuery = `
              query GetPastJobQualification($id: ID!) {
                getPastJobQualification(id: $id) {
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
              ?.getPastJobQualification;

            // If it exists, update it instead of creating
            if (existingQualification) {
              const updateQualificationMutation = `
                mutation UpdatePastJobQualification($input: UpdatePastJobQualificationInput!) {
                  updatePastJobQualification(input: $input) {
                    id
                  }
                }
              `;

              // Prepare the qualification input
              const qualificationInput = {
                id: qualification.id,
                title: qualification.title || "",
                description: qualification.description || "",
                paragraph: qualification.paragraph || "",
                userConfirmed: qualification.userConfirmed === true,
                topicId: qualification.topic?.id || "",
                userId: pastJobData.userId,
              };

              // Update the PastJobQualification
              await client.graphql({
                query: updateQualificationMutation,
                variables: {
                  input: qualificationInput,
                },
                authMode: "userPool",
              });
            } else {
              // Create a new PastJobQualification if it doesn't exist
              const createQualificationMutation = `
                mutation CreatePastJobQualification($input: CreatePastJobQualificationInput!) {
                  createPastJobQualification(input: $input) {
                    id
                  }
                }
              `;

              // Prepare the qualification input
              const qualificationInput = {
                id: qualification.id,
                title: qualification.title || "",
                description: qualification.description || "",
                paragraph: qualification.paragraph || "",
                userConfirmed: qualification.userConfirmed === true,
                topicId: qualification.topic?.id || "",
                userId: pastJobData.userId,
              };

              // Create the PastJobQualification
              await client.graphql({
                query: createQualificationMutation,
                variables: {
                  input: qualificationInput,
                },
                authMode: "userPool",
              });
            }

            // Then create the join table entry
            const createJoinMutation = `
              mutation CreatePastJobPastJobQualification($input: CreatePastJobPastJobQualificationInput!) {
                createPastJobPastJobQualification(input: $input) {
                  id
                }
              }
            `;

            // Check if the join already exists
            const checkJoinQuery = `
              query ListPastJobPastJobQualifications($filter: ModelPastJobPastJobQualificationFilterInput) {
                listPastJobPastJobQualifications(filter: $filter) {
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
                    { pastJobQualificationId: { eq: qualification.id } },
                  ],
                },
              },
              authMode: "userPool",
            });

            const existingJoins =
              (joinCheckResult as any).data?.listPastJobPastJobQualifications
                ?.items || [];

            // Only create the join if it doesn't exist
            if (existingJoins.length === 0) {
              await client.graphql({
                query: createJoinMutation,
                variables: {
                  input: {
                    id: uuidv4(),
                    pastJobId: pastJobId,
                    pastJobQualificationId: qualification.id,
                  },
                },
                authMode: "userPool",
              });
            }
          } else {
            // If the qualification exists, update it with new data
            const updateQualificationMutation = `
              mutation UpdatePastJobQualification($input: UpdatePastJobQualificationInput!) {
                updatePastJobQualification(input: $input) {
                  id
                }
              }
            `;

            // Only update fields that actually have values
            const updateFields: any = { id: qualification.id };

            if (qualification.title !== undefined)
              updateFields.title = qualification.title;
            if (qualification.description !== undefined)
              updateFields.description = qualification.description;
            if (qualification.paragraph !== undefined)
              updateFields.paragraph = qualification.paragraph;
            if (qualification.userConfirmed !== undefined)
              updateFields.userConfirmed = qualification.userConfirmed;
            if (
              qualification.topic &&
              qualification.topic.id &&
              qualification.topic.id.trim() !== ""
            )
              updateFields.topicId = qualification.topic.id;

            // Only update if we have fields to update beyond the ID
            if (Object.keys(updateFields).length > 1) {
              // Update the PastJobQualification
              await client.graphql({
                query: updateQualificationMutation,
                variables: {
                  input: updateFields,
                },
                authMode: "userPool",
              });
            }
          }
        } catch (error) {
          console.error(
            `Error processing qualification ${qualification.id}:`,
            error,
            "Qualification data:",
            JSON.stringify(qualification, null, 2)
          );
          // Continue with the next qualification rather than failing the entire operation
        }
      }

      // 4. Determine which relationships to delete
      const currentQualificationIds = new Set(
        qualifications.map((qual: PastJobQualificationType) => qual.id)
      );
      const relationshipsToDelete = existingRelationships.filter(
        (rel: any) => !currentQualificationIds.has(rel.pastJobQualificationId)
      );

      // 5. Delete relationships that are no longer needed
      const deleteMutation = `
        mutation DeletePastJobPastJobQualification($input: DeletePastJobPastJobQualificationInput!) {
          deletePastJobPastJobQualification(input: $input) {
            id
          }
        }
      `;

      for (const relationship of relationshipsToDelete) {
        await client.graphql({
          query: deleteMutation,
          variables: {
            input: {
              id: relationship.id,
            },
          },
          authMode: "userPool",
        });
      }
    }

    // 6. Fetch the updated PastJob with its relationships
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
          userId
          createdAt
          updatedAt
          pastJobQualifications {
            items {
              id
              pastJobQualificationId
              pastJobQualification {
                id
                title
                description
                paragraph
                userConfirmed
                topicId
                topic {
                  id
                  title
                  keywords
                  description
                  evidence
                  question
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
      return result.data?.getPastJob;
    }

    return null;
  } catch (error) {
    console.error("Error updating PastJob with qualifications:", error);
    throw error;
  }
}
