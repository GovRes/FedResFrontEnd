import { generateClient } from "aws-amplify/api";
import { v4 as uuidv4 } from "uuid";
import { updateModelRecord } from "./genericUpdate";
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
 * Fetch a single PastJob record with all its qualifications and related data
 *
 * @param {string} pastJobId - The ID of the PastJob to fetch
 * @returns {Promise<ApiResponse<Object>>} - API response with the PastJob data including qualifications
 */
export async function fetchPastJobWithQualifications(
  pastJobId: string
): Promise<ApiResponse<any>> {
  // Validate input
  if (!pastJobId || typeof pastJobId !== "string" || pastJobId.trim() === "") {
    return {
      success: false,
      error: "Invalid pastJobId: pastJobId must be a non-empty string",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
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
          user {
            id
            email
            givenName
            familyName
          }
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
                  jobId
                  job {
                    id
                    title
                    department
                    usaJobsId
                  }
                }
                userId
                createdAt
                updatedAt
              }
              pastJob {
                id
                title
              }
            }
          }
          applications {
            items {
              id
              applicationId
              application {
                id
                status
                completedSteps
                jobId
                job {
                  id
                  title
                  department
                  usaJobsId
                }
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
    if ("data" in result && result.data?.getPastJob) {
      const pastJob = result.data.getPastJob;

      // Transform the data to a more convenient format
      const transformedData = {
        ...pastJob,
        qualifications:
          pastJob.qualifications?.items?.map((item: any) => ({
            id: item.qualification?.id,
            title: item.qualification?.title,
            description: item.qualification?.description,
            paragraph: item.qualification?.paragraph,
            question: item.qualification?.question,
            userConfirmed: item.qualification?.userConfirmed,
            topicId: item.qualification?.topicId,
            topic: item.qualification?.topic,
            userId: item.qualification?.userId,
            createdAt: item.qualification?.createdAt,
            updatedAt: item.qualification?.updatedAt,
          })) || [],
        applications:
          pastJob.applications?.items?.map((item: any) => ({
            id: item.application?.id,
            status: item.application?.status,
            completedSteps: item.application?.completedSteps,
            jobId: item.application?.jobId,
            job: item.application?.job,
          })) || [],
      };

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
 * Fetch a single PastJob record with all its qualifications, applications for those qualifications, and the jobs those applications target
 *
 * @param {string} pastJobId - The ID of the PastJob to fetch
 * @returns {Promise<ApiResponse<Object>>} - API response with the PastJob data including qualifications with their applications and jobs
 */
export async function fetchPastJobWithQualificationsAndApplications(
  pastJobId: string
): Promise<ApiResponse<any>> {
  // Validate input
  if (!pastJobId || typeof pastJobId !== "string" || pastJobId.trim() === "") {
    return {
      success: false,
      error: "Invalid pastJobId: pastJobId must be a non-empty string",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
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
          user {
            id
            email
            givenName
            familyName
          }
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
                  jobId
                  job {
                    id
                    title
                    department
                    usaJobsId
                    agencyDescription
                    duties
                    evaluationCriteria
                    qualificationsSummary
                  }
                }
                userId
                createdAt
                updatedAt
                applications {
                  items {
                    id
                    qualificationId
                    applicationId
                    application {
                      id
                      status
                      completedSteps
                      jobId
                      createdAt
                      updatedAt
                      job {
                        id
                        title
                        department
                        usaJobsId
                        agencyDescription
                        duties
                        evaluationCriteria
                        qualificationsSummary
                      }
                      user {
                        id
                        email
                        givenName
                        familyName
                      }
                    }
                  }
                }
              }
            }
          }
          applications {
            items {
              id
              applicationId
              application {
                id
                status
                completedSteps
                jobId
                job {
                  id
                  title
                  department
                  usaJobsId
                }
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
    if ("data" in result && result.data?.getPastJob) {
      const pastJob = result.data.getPastJob;

      // Transform the data to a more convenient format
      const transformedData = {
        ...pastJob,
        qualifications:
          pastJob.qualifications?.items?.map((item: any) => ({
            id: item.qualification?.id,
            title: item.qualification?.title,
            description: item.qualification?.description,
            paragraph: item.qualification?.paragraph,
            question: item.qualification?.question,
            userConfirmed: item.qualification?.userConfirmed,
            topicId: item.qualification?.topicId,
            topic: item.qualification?.topic,
            userId: item.qualification?.userId,
            createdAt: item.qualification?.createdAt,
            updatedAt: item.qualification?.updatedAt,
            // Enhanced: Include applications for this qualification
            applications:
              item.qualification?.applications?.items?.map((appItem: any) => ({
                id: appItem.application?.id,
                status: appItem.application?.status,
                completedSteps: appItem.application?.completedSteps,
                jobId: appItem.application?.jobId,
                createdAt: appItem.application?.createdAt,
                updatedAt: appItem.application?.updatedAt,
                job: appItem.application?.job,
                user: appItem.application?.user,
              })) || [],
          })) || [],
        applications:
          pastJob.applications?.items?.map((item: any) => ({
            id: item.application?.id,
            status: item.application?.status,
            completedSteps: item.application?.completedSteps,
            jobId: item.application?.jobId,
            job: item.application?.job,
          })) || [],
      };

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
 * Fetch multiple PastJob records with their qualifications and applications for a specific user
 *
 * @param {string} userId - The ID of the user whose PastJobs to fetch
 * @param {number} limit - Optional limit on the number of results (default: 100)
 * @param {string} nextToken - Optional pagination token for fetching next page
 * @returns {Promise<ApiResponse<{items: Object[], nextToken?: string}>>} - API response with array of PastJob data
 */
export async function fetchUserPastJobsWithQualificationsAndApplications(
  userId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  // Validate input
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
    const listPastJobsQuery = `
      query ListPastJobs($filter: ModelPastJobFilterInput, $limit: Int, $nextToken: String) {
        listPastJobs(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
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
                    jobId
                    job {
                      id
                      title
                      department
                    }
                  }
                  userId
                  applications {
                    items {
                      id
                      qualificationId
                      applicationId
                      application {
                        id
                        status
                        completedSteps
                        jobId
                        createdAt
                        updatedAt
                        job {
                          id
                          title
                          department
                          usaJobsId
                        }
                        user {
                          id
                          email
                          givenName
                          familyName
                        }
                      }
                    }
                  }
                }
              }
            }
            applications {
              items {
                id
                applicationId
                application {
                  id
                  status
                  jobId
                  job {
                    id
                    title
                    department
                  }
                }
              }
            }
          }
          nextToken
        }
      }
    `;

    const result = await client.graphql({
      query: listPastJobsQuery,
      variables: {
        filter: {
          userId: { eq: userId },
        },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.listPastJobs) {
      const { items, nextToken: responseNextToken } = result.data.listPastJobs;

      // Transform the data to a more convenient format
      const transformedItems =
        items?.map((pastJob: any) => ({
          ...pastJob,
          qualifications:
            pastJob.qualifications?.items?.map((item: any) => ({
              id: item.qualification?.id,
              title: item.qualification?.title,
              description: item.qualification?.description,
              paragraph: item.qualification?.paragraph,
              question: item.qualification?.question,
              userConfirmed: item.qualification?.userConfirmed,
              topicId: item.qualification?.topicId,
              topic: item.qualification?.topic,
              userId: item.qualification?.userId,
              // Enhanced: Include applications for this qualification
              applications:
                item.qualification?.applications?.items?.map(
                  (appItem: any) => ({
                    id: appItem.application?.id,
                    status: appItem.application?.status,
                    completedSteps: appItem.application?.completedSteps,
                    jobId: appItem.application?.jobId,
                    createdAt: appItem.application?.createdAt,
                    updatedAt: appItem.application?.updatedAt,
                    job: appItem.application?.job,
                    user: appItem.application?.user,
                  })
                ) || [],
            })) || [],
          applications:
            pastJob.applications?.items?.map((item: any) => ({
              id: item.application?.id,
              status: item.application?.status,
              jobId: item.application?.jobId,
              job: item.application?.job,
            })) || [],
        })) || [];

      return {
        success: true,
        data: {
          items: transformedItems,
          nextToken: responseNextToken,
        },
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
 * Fetch multiple PastJob records with their qualifications for a specific user
 *
 * @param {string} userId - The ID of the user whose PastJobs to fetch
 * @param {number} limit - Optional limit on the number of results (default: 100)
 * @param {string} nextToken - Optional pagination token for fetching next page
 * @returns {Promise<ApiResponse<{items: Object[], nextToken?: string}>>} - API response with array of PastJob data
 */
export async function fetchUserPastJobsWithQualifications(
  userId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  // Validate input
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
    const listPastJobsQuery = `
      query ListPastJobs($filter: ModelPastJobFilterInput, $limit: Int, $nextToken: String) {
        listPastJobs(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
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
                    jobId
                    job {
                      id
                      title
                      department
                    }
                  }
                  applicationId
                  userId
                }
              }
            }
            applications {
              items {
                id
                applicationId
                application {
                  id
                  status
                  jobId
                  job {
                    id
                    title
                    department
                  }
                }
              }
            }
          }
          nextToken
        }
      }
    `;

    const result = await client.graphql({
      query: listPastJobsQuery,
      variables: {
        filter: {
          userId: { eq: userId },
        },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.listPastJobs) {
      const { items, nextToken: responseNextToken } = result.data.listPastJobs;

      // Transform the data to a more convenient format
      const transformedItems =
        items?.map((pastJob: any) => ({
          ...pastJob,
          qualifications:
            pastJob.qualifications?.items?.map((item: any) => ({
              id: item.qualification?.id,
              title: item.qualification?.title,
              description: item.qualification?.description,
              paragraph: item.qualification?.paragraph,
              question: item.qualification?.question,
              userConfirmed: item.qualification?.userConfirmed,
              topicId: item.qualification?.topicId,
              topic: item.qualification?.topic,
              userId: item.qualification?.userId,
            })) || [],
          applications:
            pastJob.applications?.items?.map((item: any) => ({
              id: item.application?.id,
              status: item.application?.status,
              jobId: item.application?.jobId,
              job: item.application?.job,
            })) || [],
        })) || [];

      return {
        success: true,
        data: {
          items: transformedItems,
          nextToken: responseNextToken,
        },
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
 * Batch version to update multiple PastJob records including their qualifications
 *
 * @param {Array<PastJobType>} pastJobUpdates - Array of PastJob objects to update
 * @returns {Promise<ApiResponse<{results: BatchResult[], summary: BatchSummary}>>} - API response with batch update results
 */
export async function batchUpdatePastJobsWithQualifications(
  pastJobUpdates: Array<PastJobType>
): Promise<ApiResponse<{ results: BatchResult[]; summary: BatchSummary }>> {
  // Validate input
  if (!Array.isArray(pastJobUpdates) || pastJobUpdates.length === 0) {
    return {
      success: false,
      error: "Invalid pastJobUpdates: must be a non-empty array",
      statusCode: 400,
    };
  }

  // Validate that all updates have IDs
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

  // Process each update in sequence to avoid overwhelming the API
  for (const update of pastJobUpdates) {
    try {
      // Use the existing single-job update function for each job
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
        errors.push({
          pastJobId: update.id!,
          error: errorMsg,
        });
        results.push({
          pastJobId: update.id!,
          success: false,
          error: errorMsg,
        });
      }
    } catch (error) {
      console.error(`Error updating PastJob ${update.id}:`, error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push({
        pastJobId: update.id!,
        error: errorMsg,
      });
      results.push({
        pastJobId: update.id!,
        success: false,
        error: errorMsg,
      });
    }
  }

  // Determine overall success
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
 * Batch version to update multiple PastJob records with parallel processing
 * Use with caution as it may cause API rate limiting issues
 *
 * @param {Array<PastJobBatchUpdateType>} pastJobUpdates - Array of objects containing pastJob update information
 * @param {number} batchSize - Optional maximum number of parallel operations (default: 3)
 * @returns {Promise<ApiResponse<{results: BatchResult[], summary: BatchSummary}>>} - API response with batch update results
 */
export async function parallelBatchUpdatePastJobsWithQualifications(
  pastJobUpdates: PastJobBatchUpdateType[],
  batchSize = 3
): Promise<ApiResponse<{ results: BatchResult[]; summary: BatchSummary }>> {
  // Validate input
  if (!Array.isArray(pastJobUpdates) || pastJobUpdates.length === 0) {
    return {
      success: false,
      error: "Invalid pastJobUpdates: must be a non-empty array",
      statusCode: 400,
    };
  }

  // Validate batch size
  if (batchSize <= 0 || batchSize > 50) {
    return {
      success: false,
      error: "Invalid batchSize: must be between 1 and 50",
      statusCode: 400,
    };
  }

  // Validate structure of updates
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

  // Process updates in batches to avoid overwhelming the API
  for (let i = 0; i < pastJobUpdates.length; i += batchSize) {
    const batch = pastJobUpdates.slice(i, i + batchSize);

    // Run updates in this batch in parallel
    const batchPromises = batch.map(async (update) => {
      try {
        const { pastJobId, pastJobData, qualifications } = update;

        const updateResult = await updatePastJobWithQualifications(
          pastJobId,
          pastJobData,
          qualifications
        );

        if (updateResult.success && updateResult.data) {
          return {
            pastJobId,
            success: true,
            data: updateResult.data,
          };
        } else {
          const errorMsg = updateResult.error || "Failed to update past job";
          errors.push({
            pastJobId,
            error: errorMsg,
          });
          return {
            pastJobId,
            success: false,
            error: errorMsg,
          };
        }
      } catch (error) {
        console.error(`Error updating PastJob ${update.pastJobId}:`, error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({
          pastJobId: update.pastJobId,
          error: errorMsg,
        });
        return {
          pastJobId: update.pastJobId,
          success: false,
          error: errorMsg,
        };
      }
    });

    // Wait for all updates in this batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // Determine overall success
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
 * @returns {Promise<ApiResponse<Object>>} - API response with the updated PastJob data
 */
export async function updatePastJobWithQualifications(
  pastJobId: string,
  pastJobData: any,
  qualifications?: Array<any>
): Promise<ApiResponse<any>> {
  // Validate inputs
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

  // Validate qualifications if provided
  if (qualifications && !Array.isArray(qualifications)) {
    return {
      success: false,
      error: "Invalid qualifications: qualifications must be an array",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    // First, extract qualifications from the data if they exist
    const { qualifications: qualificationsFromData, ...cleanPastJobData } =
      pastJobData;
    // Use qualifications from the separate parameter or from the data object
    const qualificationsToUse = qualifications || qualificationsFromData || [];

    // 1. Update the basic PastJob record first
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
                  userId
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
                  topic {
                    id
                    title
                    jobId
                    keywords
                    description
                  }
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
    if ("data" in result && result.data?.getPastJob) {
      return {
        success: true,
        data: result.data.getPastJob,
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
