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
    try {
      // Use the existing single-job update function for each job
      const updatedPastJob = await updatePastJobWithQualifications(
        update.id,
        update,
        update.qualifications
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
 * Specialized function to update a PastJob record including its qualifications
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
  console.log(`Starting update for pastJobId: ${pastJobId}`);

  try {
    // First, extract qualifications from the data if they exist
    const { qualifications: qualificationsFromData, ...cleanPastJobData } =
      pastJobData;
    // Use qualifications from the separate parameter or from the data object
    const qualificationsToUse = qualifications || qualificationsFromData || [];
    console.log(`Processing ${qualificationsToUse.length} qualifications`);

    // 1. Update the basic PastJob record first
    const updatedPastJob = await updateModelRecord(
      "PastJob",
      pastJobId,
      cleanPastJobData
    );
    console.log("PastJob basic info updated successfully");

    if (qualificationsToUse && qualificationsToUse.length > 0) {
      // Ensure all qualifications have IDs
      for (const qualification of qualificationsToUse) {
        if (!qualification.id) {
          qualification.id = uuidv4();
          console.log(
            `Generated new ID for qualification: ${qualification.id}`
          );
        }
      }

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
      console.log(
        `Found ${existingRelationships.length} existing relationships`
      );

      // Create a map of existing qualification IDs for faster lookups
      const existingQualificationIds = new Set(
        existingRelationships.map((rel: any) => rel.qualificationId)
      );

      // Create a map of existing relationships by qualification ID for faster lookups
      const existingRelationshipsMap = existingRelationships.reduce(
        (map: any, rel: any) => {
          map[rel.qualificationId] = rel;
          return map;
        },
        {}
      );

      // 3. Process each qualification
      for (const qualification of qualificationsToUse) {
        try {
          console.log(
            `Processing qualification: ${qualification.id}`,
            `Title: ${qualification.title}`,
            `Exists: ${existingQualificationIds.has(qualification.id)}`
          );

          // First ensure the Qualification record exists
          let qualificationExists = existingQualificationIds.has(
            qualification.id
          );

          // Also check if the qualification exists directly in the database
          if (!qualificationExists) {
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
            qualificationExists = !!existingQualification;
            console.log(
              `Qualification lookup result: ${
                qualificationExists ? "Found" : "Not found"
              }`
            );
          }

          // Prepare the qualification input with safe defaults
          const qualificationInput = {
            id: qualification.id,
            title: qualification.title || "",
            description: qualification.description || "",
            paragraph: qualification.paragraph || "",
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

            console.log(`Updating qualification: ${qualification.id}`);
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

            console.log(`Creating new qualification: ${qualification.id}`);
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
          console.log(
            `Found ${existingJoins.length} existing joins for qualification ${qualification.id}`
          );

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

            console.log(
              `Creating new join entry for qualification ${qualification.id}`
            );
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

      // 4. Determine which relationships to delete
      const currentQualificationIds = new Set(
        qualificationsToUse.map((qual: any) => qual.id)
      );
      const relationshipsToDelete = existingRelationships.filter(
        (rel: any) => !currentQualificationIds.has(rel.qualificationId)
      );

      console.log(
        `Found ${relationshipsToDelete.length} relationships to delete`
      );

      // 5. Delete relationships that are no longer needed
      const deleteMutation = `
        mutation DeletePastJobQualification($input: DeletePastJobQualificationInput!) {
          deletePastJobQualification(input: $input) {
            id
          }
        }
      `;

      for (const relationship of relationshipsToDelete) {
        console.log(
          `Deleting relationship: ${relationship.id} for qualification ${relationship.qualificationId}`
        );
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

    console.log("Successfully fetched updated PastJob with qualifications");

    // Check if the result is a GraphQLResult type with data
    if ("data" in result) {
      const pastJob = result.data?.getPastJob;
      const qualificationCount = pastJob?.qualifications?.items?.length || 0;
      console.log(`Final PastJob has ${qualificationCount} qualifications`);
      return pastJob;
    }

    return null;
  } catch (error) {
    console.error("Error updating PastJob with qualifications:", error);
    throw error;
  }
}
