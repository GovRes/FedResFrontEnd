import { generateClient } from "aws-amplify/api";
import { v4 as uuidv4 } from "uuid";
import { updateModelRecord } from "./genericUpdate";
import { buildQueryWithFragments } from "./graphqlFragments"; // Import the proper function
import { QualificationType, PastJobType } from "../utils/responseSchemas";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export type PastJobBatchUpdateType = {
  pastJobId: string;
  pastJobData: PastJobType;
  qualifications?: QualificationType[];
};

type BatchResult = {
  pastJobId: string;
  success: boolean;
  data?: any;
  error?: string;
};

type BatchSummary = {
  total: number;
  successful: number;
  failed: number;
  errors: { pastJobId: string; error: string }[] | null;
};

/**
 * Transform a single pastJob object to flatten qualifications and applications arrays
 */
function transformPastJob(pastJob: any): any {
  if (!pastJob) return pastJob;

  const transformed = { ...pastJob };

  // Transform qualifications from .items array to direct array
  if (transformed.qualifications?.items) {
    transformed.qualifications = transformed.qualifications.items;
  }

  // Transform applications from .items array to direct array
  if (transformed.applications?.items) {
    transformed.applications = transformed.applications.items;
  }

  // Also transform nested applications within qualifications
  if (Array.isArray(transformed.qualifications)) {
    transformed.qualifications = transformed.qualifications.map((qual: any) => {
      if (qual.applications?.items) {
        // Transform the junction table structure to direct application objects
        const directApplications = qual.applications.items
          .map((junction: any) => junction.application)
          .filter((app: any) => app !== null && app !== undefined);

        return {
          ...qual,
          applications: directApplications,
        };
      }
      return qual;
    });
  }

  return transformed;
}

/**
 * Transform multiple pastJob objects
 */
function transformPastJobs(pastJobs: any[]): any[] {
  if (!Array.isArray(pastJobs)) return pastJobs;
  return pastJobs.map(transformPastJob);
}

/**
 * Fetch a single PastJob record with all its qualifications and related data
 */
export async function fetchPastJobWithQualifications(
  pastJobId: string
): Promise<ApiResponse<any>> {
  if (!pastJobId || typeof pastJobId !== "string" || pastJobId.trim() === "") {
    return {
      success: false,
      error: "Invalid pastJobId: pastJobId must be a non-empty string",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query GetPastJob($id: ID!) {
        getPastJob(id: $id) {
          ...PastJobFields
          user {
            ...UserBasicFields
          }
          qualifications {
            items {
              ...QualificationWithTopicFields
            }
          }
          applications {
            items {
              ...PastJobApplicationFields
            }
          }
        }
      }
    `);

    const result = await client.graphql({
      query,
      variables: { id: pastJobId },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.getPastJob) {
      const transformedData = transformPastJob(result.data.getPastJob);
      return {
        success: true,
        data: transformedData,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `PastJob with ID: ${pastJobId} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error("Error fetching PastJob with qualifications:", error);
    return {
      success: false,
      error: `Failed to fetch PastJob with qualifications: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Fetch a single PastJob record with qualifications, applications, and jobs
 */
export async function fetchPastJobWithQualificationsAndApplications(
  pastJobId: string
): Promise<ApiResponse<any>> {
  if (!pastJobId || typeof pastJobId !== "string" || pastJobId.trim() === "") {
    return {
      success: false,
      error: "Invalid pastJobId: pastJobId must be a non-empty string",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query GetPastJob($id: ID!) {
        getPastJob(id: $id) {
          ...PastJobFields
          user {
            ...UserBasicFields
          }
          qualifications {
            items {
              ...QualificationFields
              topic {
                ...TopicWithJobFields
              }
              applications {
                items {
                  id
                  qualificationId
                  applicationId
                  application {
                    ...ApplicationWithJobDetailedFields
                  }
                }
              }
            }
          }
          applications {
            items {
              ...PastJobApplicationFields
            }
          }
        }
      }
    `);

    const result = await client.graphql({
      query,
      variables: { id: pastJobId },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.getPastJob) {
      const transformedData = transformPastJob(result.data.getPastJob);
      return {
        success: true,
        data: transformedData,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `PastJob with ID: ${pastJobId} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error(
      "Error fetching PastJob with qualifications and applications:",
      error
    );
    return {
      success: false,
      error: `Failed to fetch PastJob with qualifications and applications: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Fetch multiple PastJob records with qualifications and applications for a user
 */
export async function fetchUserPastJobsWithQualificationsAndApplications(
  userId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return {
      success: false,
      error: "Invalid userId: userId must be a non-empty string",
      statusCode: 400,
    };
  }

  if (limit <= 0 || limit > 1000) {
    return {
      success: false,
      error: "Invalid limit: limit must be between 1 and 1000",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query ListPastJobs($filter: ModelPastJobFilterInput, $limit: Int, $nextToken: String) {
        listPastJobs(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ...PastJobFields
            qualifications {
              items {
                ...QualificationFields
                topic {
                  ...TopicWithJobFields
                }
                applications {
                  items {
                    id
                    qualificationId
                    applicationId
                    application {
                      ...ApplicationWithJobDetailedFields
                    }
                  }
                }
              }
            }
            applications {
              items {
                ...PastJobApplicationFields
              }
            }
          }
          nextToken
        }
      }
    `);

    const result = await client.graphql({
      query,
      variables: {
        filter: { userId: { eq: userId } },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.listPastJobs) {
      const { items, nextToken: responseNextToken } = result.data.listPastJobs;
      const transformedItems = transformPastJobs(items || []);
      return {
        success: true,
        data: { items: transformedItems, nextToken: responseNextToken },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `No PastJobs found for user: ${userId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error(
      "Error fetching user PastJobs with qualifications and applications:",
      error
    );
    return {
      success: false,
      error: `Failed to fetch PastJobs for user: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Fetch multiple PastJob records with qualifications for a user
 */
export async function fetchUserPastJobsWithQualifications(
  userId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return {
      success: false,
      error: "Invalid userId: userId must be a non-empty string",
      statusCode: 400,
    };
  }

  if (limit <= 0 || limit > 1000) {
    return {
      success: false,
      error: "Invalid limit: limit must be between 1 and 1000",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query ListPastJobs($filter: ModelPastJobFilterInput, $limit: Int, $nextToken: String) {
        listPastJobs(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ...PastJobFields
            qualifications {
              items {
                ...QualificationWithTopicFields
              }
            }
            applications {
              items {
                ...PastJobApplicationFields
              }
            }
          }
          nextToken
        }
      }
    `);

    const result = await client.graphql({
      query,
      variables: {
        filter: { userId: { eq: userId } },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.listPastJobs) {
      const { items, nextToken: responseNextToken } = result.data.listPastJobs;
      const transformedItems = transformPastJobs(items || []);
      return {
        success: true,
        data: { items: transformedItems, nextToken: responseNextToken },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `No PastJobs found for user: ${userId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error("Error fetching user PastJobs with qualifications:", error);
    return {
      success: false,
      error: `Failed to fetch PastJobs for user: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Batch update multiple PastJob records
 */
export async function batchUpdatePastJobsWithQualifications(
  pastJobUpdates: Array<PastJobType>
): Promise<ApiResponse<{ results: BatchResult[]; summary: BatchSummary }>> {
  if (!Array.isArray(pastJobUpdates) || pastJobUpdates.length === 0) {
    return {
      success: false,
      error: "Invalid pastJobUpdates: must be a non-empty array",
      statusCode: 400,
    };
  }

  const updatesWithoutIds = pastJobUpdates.filter((update) => !update.id);
  if (updatesWithoutIds.length > 0) {
    return {
      success: false,
      error: `${updatesWithoutIds.length} past job updates are missing required id field`,
      statusCode: 400,
    };
  }

  const results: BatchResult[] = [];
  const errors: { pastJobId: string; error: string }[] = [];

  for (const update of pastJobUpdates) {
    try {
      const updateResult = await updatePastJobWithQualifications(
        update.id!,
        update,
        Array.isArray(update.qualifications) ? update.qualifications : undefined
      );

      if (updateResult.success && updateResult.data) {
        results.push({
          pastJobId: update.id!,
          success: true,
          data: updateResult.data,
        });
      } else {
        const errorMsg = updateResult.error || "Failed to update past job";
        errors.push({ pastJobId: update.id!, error: errorMsg });
        results.push({
          pastJobId: update.id!,
          success: false,
          error: errorMsg,
        });
      }
    } catch (error) {
      console.error(`Error updating PastJob ${update.id}:`, error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({ pastJobId: update.id!, error: errorMsg });
      results.push({ pastJobId: update.id!, success: false, error: errorMsg });
    }
  }

  const successfulCount = results.filter((r) => r.success).length;
  const hasSuccessful = successfulCount > 0;
  const allFailed = errors.length === pastJobUpdates.length;

  const summary: BatchSummary = {
    total: pastJobUpdates.length,
    successful: successfulCount,
    failed: errors.length,
    errors: errors.length > 0 ? errors : null,
  };

  if (allFailed) {
    return {
      success: false,
      error: `Failed to update all ${pastJobUpdates.length} past job records`,
      statusCode: 500,
    };
  }

  return {
    success: hasSuccessful,
    data: { results, summary },
    statusCode: hasSuccessful ? 200 : 500,
    ...(errors.length > 0 && {
      error: `${errors.length} of ${pastJobUpdates.length} past job updates failed`,
    }),
  };
}

/**
 * Parallel batch update with configurable batch size
 */
export async function parallelBatchUpdatePastJobsWithQualifications(
  pastJobUpdates: PastJobBatchUpdateType[],
  batchSize = 3
): Promise<ApiResponse<{ results: BatchResult[]; summary: BatchSummary }>> {
  if (!Array.isArray(pastJobUpdates) || pastJobUpdates.length === 0) {
    return {
      success: false,
      error: "Invalid pastJobUpdates: must be a non-empty array",
      statusCode: 400,
    };
  }

  if (batchSize <= 0 || batchSize > 50) {
    return {
      success: false,
      error: "Invalid batchSize: must be between 1 and 50",
      statusCode: 400,
    };
  }

  const invalidUpdates = pastJobUpdates.filter(
    (update) =>
      !update ||
      typeof update !== "object" ||
      !update.pastJobId ||
      typeof update.pastJobId !== "string" ||
      !update.pastJobData ||
      typeof update.pastJobData !== "object"
  );

  if (invalidUpdates.length > 0) {
    return {
      success: false,
      error: `${invalidUpdates.length} updates have invalid structure (missing pastJobId or pastJobData)`,
      statusCode: 400,
    };
  }

  const results: BatchResult[] = [];
  const errors: { pastJobId: string; error: string }[] = [];

  for (let i = 0; i < pastJobUpdates.length; i += batchSize) {
    const batch = pastJobUpdates.slice(i, i + batchSize);

    const batchPromises = batch.map(async (update) => {
      try {
        const { pastJobId, pastJobData, qualifications } = update;
        const updateResult = await updatePastJobWithQualifications(
          pastJobId,
          pastJobData,
          qualifications
        );

        if (updateResult.success && updateResult.data) {
          return { pastJobId, success: true, data: updateResult.data };
        } else {
          const errorMsg = updateResult.error || "Failed to update past job";
          errors.push({ pastJobId, error: errorMsg });
          return { pastJobId, success: false, error: errorMsg };
        }
      } catch (error) {
        console.error(`Error updating PastJob ${update.pastJobId}:`, error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({ pastJobId: update.pastJobId, error: errorMsg });
        return { pastJobId: update.pastJobId, success: false, error: errorMsg };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const successfulCount = results.filter((r) => r.success).length;
  const hasSuccessful = successfulCount > 0;
  const allFailed = errors.length === pastJobUpdates.length;

  const summary: BatchSummary = {
    total: pastJobUpdates.length,
    successful: successfulCount,
    failed: errors.length,
    errors: errors.length > 0 ? errors : null,
  };

  if (allFailed) {
    return {
      success: false,
      error: `Failed to update all ${pastJobUpdates.length} past job records`,
      statusCode: 500,
    };
  }

  return {
    success: hasSuccessful,
    data: { results, summary },
    statusCode: hasSuccessful ? 200 : 500,
    ...(errors.length > 0 && {
      error: `${errors.length} of ${pastJobUpdates.length} past job updates failed`,
    }),
  };
}

/**
 * Helper function to check if two qualifications are similar
 */
function areQualificationsSimilar(qual1: any, qual2: any): boolean {
  const title1 = (qual1.title || "").toLowerCase().trim();
  const title2 = (qual2.title || "").toLowerCase().trim();
  const desc1 = (qual1.description || "").toLowerCase().trim();
  const desc2 = (qual2.description || "").toLowerCase().trim();

  return title1 === title2 && desc1 === desc2;
}

/**
 * Update a PastJob record including its qualifications
 */
export async function updatePastJobWithQualifications(
  pastJobId: string,
  pastJobData: any,
  qualifications?: Array<any>
): Promise<ApiResponse<any>> {
  if (!pastJobId || typeof pastJobId !== "string" || pastJobId.trim() === "") {
    return {
      success: false,
      error: "Invalid pastJobId: pastJobId must be a non-empty string",
      statusCode: 400,
    };
  }

  if (!pastJobData || typeof pastJobData !== "object") {
    return {
      success: false,
      error: "Invalid pastJobData: pastJobData must be a non-null object",
      statusCode: 400,
    };
  }

  if (qualifications && !Array.isArray(qualifications)) {
    return {
      success: false,
      error: "Invalid qualifications: qualifications must be an array",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const { qualifications: qualificationsFromData, ...cleanPastJobData } =
      pastJobData;
    const qualificationsToUse = qualifications || qualificationsFromData || [];

    // Update the basic PastJob record
    const updateResult = await updateModelRecord(
      "PastJob",
      pastJobId,
      cleanPastJobData
    );
    if (!updateResult.success) {
      return {
        success: false,
        error: `Failed to update PastJob: ${updateResult.error}`,
        statusCode: updateResult.statusCode,
      };
    }

    // Store created/updated qualification IDs to return
    const processedQualificationIds: string[] = [];

    if (qualificationsToUse && qualificationsToUse.length > 0) {
      // Get existing qualifications
      const existingQualificationsQuery = buildQueryWithFragments(`
        query ListQualifications($filter: ModelQualificationFilterInput) {
          listQualifications(filter: $filter) {
            items {
              ...QualificationFields
            }
          }
        }
      `);

      const existingResult = await client.graphql({
        query: existingQualificationsQuery,
        variables: { filter: { pastJobId: { eq: pastJobId } } },
        authMode: "userPool",
      });

      const existingQualifications =
        (existingResult as any).data?.listQualifications?.items || [];

      // Process each new qualification
      for (const qualification of qualificationsToUse) {
        try {
          const similarExisting = existingQualifications.find((existing: any) =>
            areQualificationsSimilar(qualification, existing)
          );

          if (similarExisting) {
            // If similar qualification exists, add its ID to our processed list
            processedQualificationIds.push(similarExisting.id);
            continue;
          }

          if (!qualification.id) {
            qualification.id = uuidv4();
          }

          // Check if qualification exists
          const getQualificationQuery = buildQueryWithFragments(`
            query GetQualification($id: ID!) {
              getQualification(id: $id) {
                id
              }
            }
          `);

          const existingQualResult = await client.graphql({
            query: getQualificationQuery,
            variables: { id: qualification.id },
            authMode: "userPool",
          });

          const qualificationExists = !!(existingQualResult as any).data
            ?.getQualification;

          const qualificationInput = {
            id: qualification.id,
            title: qualification.title || "",
            description: qualification.description || "",
            paragraph: qualification.paragraph || "",
            question: qualification.question || "",
            userConfirmed: qualification.userConfirmed || false,
            topicId: qualification.topic?.id || qualification.topicId || "",
            userId: pastJobData.userId,
            pastJobId: pastJobId,
          };

          if (qualificationExists) {
            const updateMutation = buildQueryWithFragments(`
              mutation UpdateQualification($input: UpdateQualificationInput!) {
                updateQualification(input: $input) { 
                  id
                  title
                  description
                  paragraph
                  question
                  userConfirmed
                  topicId
                  userId
                  pastJobId
                }
              }
            `);
            const updateResponse = await client.graphql({
              query: updateMutation,
              variables: { input: qualificationInput },
              authMode: "userPool",
            });

            // Add the updated qualification ID
            if ((updateResponse as any).data?.updateQualification?.id) {
              processedQualificationIds.push(
                (updateResponse as any).data.updateQualification.id
              );
            }
          } else {
            const createMutation = buildQueryWithFragments(`
              mutation CreateQualification($input: CreateQualificationInput!) {
                createQualification(input: $input) { 
                  id
                  title
                  description
                  paragraph
                  question
                  userConfirmed
                  topicId
                  userId
                  pastJobId
                }
              }
            `);
            const createResponse = await client.graphql({
              query: createMutation,
              variables: { input: qualificationInput },
              authMode: "userPool",
            });

            // Add the created qualification ID
            if ((createResponse as any).data?.createQualification?.id) {
              processedQualificationIds.push(
                (createResponse as any).data.createQualification.id
              );
            }
          }
        } catch (error) {
          console.error(
            `Error processing qualification ${qualification.id}:`,
            error
          );
        }
      }
    }

    // Fetch updated PastJob with the correct structure that matches your transformation expectations
    const finalQuery = buildQueryWithFragments(`
      query GetPastJob($id: ID!) {
        getPastJob(id: $id) {
          ...PastJobFields
          qualifications {
            items {
              id
              title
              description
              paragraph
              question
              userConfirmed
              topicId
              userId
              pastJobId
              topic {
                ...TopicWithJobFields
              }
              applications {
                items {
                  id
                  applicationId
                  qualificationId
                  application {
                    id
                    createdAt
                    updatedAt
                  }
                }
              }
            }
          }
          applications {
            items {
              ...PastJobApplicationFields
            }
          }
        }
      }
    `);

    const result = await client.graphql({
      query: finalQuery,
      variables: { id: pastJobId },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.getPastJob) {
      const pastJobResult = result.data.getPastJob;

      // Transform the data to match what your page component expects
      const transformedData = {
        ...pastJobResult,
        qualifications: {
          items: (pastJobResult.qualifications?.items || []).map(
            (qual: any) => ({
              qualification: {
                id: qual.id,
                title: qual.title,
                description: qual.description,
                paragraph: qual.paragraph,
                question: qual.question,
                userConfirmed: qual.userConfirmed,
                topicId: qual.topicId,
                userId: qual.userId,
                topic: qual.topic,
              },
            })
          ),
        },
        applications: pastJobResult.applications,
      };

      // Ensure the transformed qualifications maintain the expected structure
      if (transformedData.qualifications?.items) {
        transformedData.qualifications =
          transformedData.qualifications.items.map(
            (item: any) => item.qualification
          );
      }

      return {
        success: true,
        data: transformedData,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `PastJob with ID: ${pastJobId} not found after update`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error("Error updating PastJob with qualifications:", error);
    return {
      success: false,
      error: `Failed to update PastJob with qualifications: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}
