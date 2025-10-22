import { generateClient } from "aws-amplify/api";
import { v4 as uuidv4 } from "uuid";
import { updateModelRecord } from "./genericUpdate";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import { QualificationType, PastJobType } from "../utils/responseSchemas";
import {
  validateAndSanitizeId,
  validateAndSanitizeObject,
  sanitizeOrError,
  validateLimit,
  validateBatchSize,
  validateOrError,
  sanitizeId,
} from "../utils/validators";
import {
  BATCH_CONFIG,
  getRetryConfigForOperation,
  QUERY_LIMITS,
} from "../utils/constants";
import { withRetry, RetryConfig } from "../utils/retry";

import { ApiResponse } from "../utils/api";
const READ_RETRY_CONFIG = getRetryConfigForOperation("read");
const WRITE_RETRY_CONFIG = getRetryConfigForOperation("write");

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
 * Improved with Object.assign and pre-allocated arrays for better memory efficiency
 */
function transformPastJob(pastJob: any): any {
  if (!pastJob) return pastJob;

  // Use Object.assign for better performance on large objects
  const transformed = Object.assign({}, pastJob);

  // Transform qualifications from .items array to direct array
  if (transformed.qualifications?.items) {
    transformed.qualifications = transformed.qualifications.items;
  }

  // Transform applications from .items array to direct array
  if (transformed.applications?.items) {
    transformed.applications = transformed.applications.items;
  }

  // Transform nested applications within qualifications
  if (Array.isArray(transformed.qualifications)) {
    // Pre-allocate array if we know the size
    const qualificationsCount = transformed.qualifications.length;
    const transformedQuals = new Array(qualificationsCount);

    for (let i = 0; i < qualificationsCount; i++) {
      const qual = transformed.qualifications[i];

      if (qual.applications?.items) {
        // Filter and map in one pass
        const directApplications = [];
        for (const junction of qual.applications.items) {
          if (
            junction.application !== null &&
            junction.application !== undefined
          ) {
            directApplications.push(junction.application);
          }
        }

        transformedQuals[i] = Object.assign({}, qual, {
          applications: directApplications,
        });
      } else {
        transformedQuals[i] = qual;
      }
    }

    transformed.qualifications = transformedQuals;
  }

  return transformed;
}

/**
 * Transform multiple pastJob objects with chunking for large datasets
 */
function transformPastJobs(pastJobs: any[], chunkSize: number = 100): any[] {
  if (!Array.isArray(pastJobs)) return pastJobs;

  // For small arrays, use the simple approach
  if (pastJobs.length <= chunkSize) {
    return pastJobs.map(transformPastJob);
  }

  // For large arrays, process in chunks with GC hints
  const transformed: any[] = [];

  for (let i = 0; i < pastJobs.length; i += chunkSize) {
    const chunk = pastJobs.slice(i, i + chunkSize);
    const transformedChunk = chunk.map(transformPastJob);

    // Push results individually to avoid spread operator overhead
    for (const item of transformedChunk) {
      transformed.push(item);
    }

    // Allow garbage collection between chunks
    if (typeof global !== "undefined" && global.gc) {
      global.gc();
    }
  }

  return transformed;
}

/**
 * Fetch a single PastJob record with all its qualifications and related data
 */
export async function fetchPastJobWithQualifications(
  pastJobId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<any>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize pastJobId
  const pastJobIdResult = sanitizeOrError(
    validateAndSanitizeId(pastJobId, "pastJobId")
  );
  if (!pastJobIdResult.success) return pastJobIdResult.error;
  const sanitizedPastJobId = pastJobIdResult.sanitized;

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

    const result = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: { id: sanitizedPastJobId },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

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
        error: `PastJob with ID: ${sanitizedPastJobId} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "PastJob with qualifications",
      error,
      sanitizedPastJobId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Fetch a single PastJob record with qualifications, applications, and jobs
 */
export async function fetchPastJobWithQualificationsAndApplications(
  pastJobId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<any>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize pastJobId
  const pastJobIdResult = sanitizeOrError(
    validateAndSanitizeId(pastJobId, "pastJobId")
  );
  if (!pastJobIdResult.success) return pastJobIdResult.error;
  const sanitizedPastJobId = pastJobIdResult.sanitized;

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

    const result = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: { id: sanitizedPastJobId },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

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
        error: `PastJob with ID: ${sanitizedPastJobId} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "PastJob with qualifications and applications",
      error,
      sanitizedPastJobId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Fetch multiple PastJob records with qualifications and applications for a user
 */
export async function fetchUserPastJobsWithQualificationsAndApplications(
  userId: string,
  limit: number = QUERY_LIMITS.DEFAULT_LIST_LIMIT,
  nextToken?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize userId
  const userIdResult = sanitizeOrError(validateAndSanitizeId(userId, "userId"));
  if (!userIdResult.success) return userIdResult.error;
  const sanitizedUserId = userIdResult.sanitized;

  // Validate limit
  const limitValidation = validateOrError(validateLimit(limit));
  if (limitValidation) return limitValidation;

  // Sanitize nextToken if provided
  let sanitizedNextToken = nextToken;
  if (nextToken !== undefined && nextToken !== null) {
    const tokenResult = sanitizeOrError(
      validateAndSanitizeId(nextToken, "nextToken")
    );
    if (!tokenResult.success) return tokenResult.error;
    sanitizedNextToken = tokenResult.sanitized;
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

    const result = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: {
          filter: { userId: { eq: sanitizedUserId } },
          limit,
          nextToken: sanitizedNextToken,
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

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
        error: `No PastJobs found for user: ${sanitizedUserId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "user PastJobs with qualifications and applications",
      error,
      sanitizedUserId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Fetch multiple PastJob records with qualifications for a user
 */
export async function fetchUserPastJobsWithQualifications(
  userId: string,
  limit: number = QUERY_LIMITS.DEFAULT_LIST_LIMIT,
  nextToken?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize userId
  const userIdResult = sanitizeOrError(validateAndSanitizeId(userId, "userId"));
  if (!userIdResult.success) return userIdResult.error;
  const sanitizedUserId = userIdResult.sanitized;

  // Validate limit
  const limitValidation = validateOrError(validateLimit(limit));
  if (limitValidation) return limitValidation;

  // Sanitize nextToken if provided
  let sanitizedNextToken = nextToken;
  if (nextToken !== undefined && nextToken !== null) {
    const tokenResult = sanitizeOrError(
      validateAndSanitizeId(nextToken, "nextToken")
    );
    if (!tokenResult.success) return tokenResult.error;
    sanitizedNextToken = tokenResult.sanitized;
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

    const result = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: {
          filter: { userId: { eq: sanitizedUserId } },
          limit,
          nextToken: sanitizedNextToken,
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

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
        error: `No PastJobs found for user: ${sanitizedUserId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "user PastJobs with qualifications",
      error,
      sanitizedUserId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Batch update multiple PastJob records with parallel processing and memory management
 * IMPROVED: Now uses parallel batches instead of sequential processing
 */
export async function batchUpdatePastJobsWithQualifications(
  pastJobUpdates: Array<PastJobType>,
  batchSize: number = BATCH_CONFIG.PARALLEL_BATCH_SIZE
): Promise<ApiResponse<{ results: BatchResult[]; summary: BatchSummary }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate that pastJobUpdates is a non-empty array
  if (!Array.isArray(pastJobUpdates) || pastJobUpdates.length === 0) {
    return {
      success: false,
      error: "Invalid pastJobUpdates: pastJobUpdates must be a non-empty array",
      statusCode: 400,
    };
  }

  // Validate batch size
  const batchSizeValidation = validateOrError(
    validateBatchSize(
      batchSize,
      BATCH_CONFIG.MIN_BATCH_SIZE,
      BATCH_CONFIG.MAX_BATCH_SIZE
    )
  );
  if (batchSizeValidation) return batchSizeValidation;

  // Sanitize each pastJob update
  const sanitizedUpdates: Array<PastJobType> = [];
  for (const update of pastJobUpdates) {
    if (!update.id) {
      return {
        success: false,
        error: "All past job updates must have an id field",
        statusCode: 400,
      };
    }

    const idResult = validateAndSanitizeId(update.id, "pastJob.id");
    if (!idResult.isValid) {
      return {
        success: false,
        error: `Invalid pastJob id: ${idResult.error}`,
        statusCode: 400,
      };
    }

    const updateResult = validateAndSanitizeObject(update, "pastJob", {
      preserveFields: ["id", "createdAt", "updatedAt", "userId"],
      escapeHtml: false,
      maxLength: 20000,
    });
    if (!updateResult.isValid) {
      return {
        success: false,
        error: `Invalid pastJob data: ${updateResult.error}`,
        statusCode: 400,
      };
    }

    sanitizedUpdates.push({
      ...updateResult.sanitized,
      id: idResult.sanitized,
    });
  }

  const results: BatchResult[] = [];
  const errors: { pastJobId: string; error: string }[] = [];

  // Process in parallel batches instead of sequentially
  for (let i = 0; i < sanitizedUpdates.length; i += batchSize) {
    const batch = sanitizedUpdates.slice(i, i + batchSize);

    const batchPromises = batch.map(async (update) => {
      try {
        const updateResult = await updatePastJobWithQualificationsInternal(
          update.id!,
          update,
          Array.isArray(update.qualifications)
            ? update.qualifications
            : undefined
        );

        if (updateResult.success && updateResult.data) {
          return {
            pastJobId: update.id!,
            success: true,
            data: updateResult.data,
          };
        } else {
          const errorMsg = updateResult.error || "Failed to update past job";
          return {
            pastJobId: update.id!,
            success: false,
            error: errorMsg,
          };
        }
      } catch (error) {
        const errorResult = handleError("update", "PastJob", error, update.id);
        return {
          pastJobId: update.id!,
          success: false,
          error: errorResult.error,
        };
      }
    });

    // Use Promise.allSettled for robust error handling
    const batchResults = await Promise.allSettled(batchPromises);

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];

      if (result.status === "fulfilled") {
        const value = result.value;

        if (value.success) {
          results.push(value);
        } else {
          errors.push({
            pastJobId: value.pastJobId,
            error: value.error || "Unknown error",
          });
          results.push(value);
        }
      } else {
        const update = batch[j];
        const errorMsg = result.reason?.message || "Promise rejected";

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

    // Allow garbage collection between batches
    if (typeof global !== "undefined" && global.gc) {
      global.gc();
    }
  }

  const successfulCount = results.filter((r) => r.success).length;
  const hasSuccessful = successfulCount > 0;
  const allFailed = errors.length === sanitizedUpdates.length;

  const summary: BatchSummary = {
    total: sanitizedUpdates.length,
    successful: successfulCount,
    failed: errors.length,
    errors: errors.length > 0 ? errors : null,
  };

  if (allFailed) {
    return {
      success: false,
      error: `Failed to update all ${sanitizedUpdates.length} past job records`,
      statusCode: 500,
    };
  }

  return {
    success: hasSuccessful,
    data: { results, summary },
    statusCode: hasSuccessful ? 200 : 500,
    ...(errors.length > 0 && {
      error: `${errors.length} of ${sanitizedUpdates.length} past job updates failed`,
    }),
  };
}

/**
 * Parallel batch update with configurable batch size
 * IMPROVED: Now uses Promise.allSettled for better error handling
 */
export async function parallelBatchUpdatePastJobsWithQualifications(
  pastJobUpdates: PastJobBatchUpdateType[],
  batchSize = BATCH_CONFIG.PARALLEL_BATCH_SIZE
): Promise<ApiResponse<{ results: BatchResult[]; summary: BatchSummary }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate that pastJobUpdates is a non-empty array
  if (!Array.isArray(pastJobUpdates) || pastJobUpdates.length === 0) {
    return {
      success: false,
      error: "Invalid pastJobUpdates: pastJobUpdates must be a non-empty array",
      statusCode: 400,
    };
  }

  // Validate batch size
  const batchSizeValidation = validateOrError(
    validateBatchSize(
      batchSize,
      BATCH_CONFIG.MIN_BATCH_SIZE,
      BATCH_CONFIG.MAX_BATCH_SIZE
    )
  );
  if (batchSizeValidation) return batchSizeValidation;

  // Sanitize and validate each update
  const sanitizedUpdates: PastJobBatchUpdateType[] = [];
  for (const update of pastJobUpdates) {
    if (
      !update ||
      typeof update !== "object" ||
      !update.pastJobId ||
      !update.pastJobData
    ) {
      return {
        success: false,
        error: "Invalid update structure: missing pastJobId or pastJobData",
        statusCode: 400,
      };
    }

    const idResult = validateAndSanitizeId(update.pastJobId, "pastJobId");
    if (!idResult.isValid) {
      return {
        success: false,
        error: `Invalid pastJobId: ${idResult.error}`,
        statusCode: 400,
      };
    }

    const dataResult = validateAndSanitizeObject(
      update.pastJobData,
      "pastJobData",
      {
        preserveFields: ["id", "createdAt", "updatedAt", "userId"],
        escapeHtml: false,
        maxLength: 20000,
      }
    );
    if (!dataResult.isValid) {
      return {
        success: false,
        error: `Invalid pastJobData: ${dataResult.error}`,
        statusCode: 400,
      };
    }

    sanitizedUpdates.push({
      pastJobId: idResult.sanitized,
      pastJobData: dataResult.sanitized,
      qualifications: update.qualifications,
    });
  }

  const results: BatchResult[] = [];
  const errors: { pastJobId: string; error: string }[] = [];

  for (let i = 0; i < sanitizedUpdates.length; i += batchSize) {
    const batch = sanitizedUpdates.slice(i, i + batchSize);

    const batchPromises = batch.map(async (update) => {
      const { pastJobId, pastJobData, qualifications } = update;

      try {
        const updateResult = await updatePastJobWithQualificationsInternal(
          pastJobId,
          pastJobData,
          qualifications
        );

        if (updateResult.success && updateResult.data) {
          return { pastJobId, success: true, data: updateResult.data };
        } else {
          const errorMsg = updateResult.error || "Failed to update past job";
          return { pastJobId, success: false, error: errorMsg };
        }
      } catch (error) {
        const errorResult = handleError("update", "PastJob", error, pastJobId);
        return {
          pastJobId,
          success: false,
          error: errorResult.error,
        };
      }
    });

    // Use Promise.allSettled for robust error handling
    const batchResults = await Promise.allSettled(batchPromises);

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];

      if (result.status === "fulfilled") {
        const value = result.value;

        if (value.success) {
          results.push(value);
        } else {
          errors.push({
            pastJobId: value.pastJobId,
            error: value.error || "Unknown error",
          });
          results.push(value);
        }
      } else {
        // Unexpected rejection (shouldn't happen with try-catch above)
        const update = batch[j];
        const errorMsg =
          result.reason?.message || "Promise rejected unexpectedly";

        errors.push({
          pastJobId: update.pastJobId,
          error: errorMsg,
        });
        results.push({
          pastJobId: update.pastJobId,
          success: false,
          error: errorMsg,
        });
      }
    }

    // Allow garbage collection between batches
    if (typeof global !== "undefined" && global.gc) {
      global.gc();
    }
  }

  const successfulCount = results.filter((r) => r.success).length;
  const hasSuccessful = successfulCount > 0;
  const allFailed = errors.length === sanitizedUpdates.length;

  const summary: BatchSummary = {
    total: sanitizedUpdates.length,
    successful: successfulCount,
    failed: errors.length,
    errors: errors.length > 0 ? errors : null,
  };

  if (allFailed) {
    return {
      success: false,
      error: `Failed to update all ${sanitizedUpdates.length} past job records`,
      statusCode: 500,
    };
  }

  return {
    success: hasSuccessful,
    data: { results, summary },
    statusCode: hasSuccessful ? 200 : 500,
    ...(errors.length > 0 && {
      error: `${errors.length} of ${sanitizedUpdates.length} past job updates failed`,
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
 * Fetch existing qualifications for a PastJob
 */
async function fetchExistingQualifications(
  client: any,
  pastJobId: string,
  retryConfig?: RetryConfig
): Promise<any[]> {
  const existingQualificationsQuery = buildQueryWithFragments(`
    query ListQualifications($filter: ModelQualificationFilterInput) {
      listQualifications(filter: $filter) {
        items {
          ...QualificationFields
        }
      }
    }
  `);

  const existingResult = await withRetry(async () => {
    return await client.graphql({
      query: existingQualificationsQuery,
      variables: { filter: { pastJobId: { eq: pastJobId } } },
      authMode: "userPool",
    });
  }, retryConfig || READ_RETRY_CONFIG);

  return (existingResult as any).data?.listQualifications?.items || [];
}

/**
 * Check if a qualification exists by ID
 */
async function checkQualificationExists(
  client: any,
  qualificationId: string,
  retryConfig?: RetryConfig
): Promise<boolean> {
  const getQualificationQuery = buildQueryWithFragments(`
    query GetQualification($id: ID!) {
      getQualification(id: $id) {
        id
      }
    }
  `);

  const existingQualResult = await withRetry(async () => {
    return await client.graphql({
      query: getQualificationQuery,
      variables: { id: qualificationId },
      authMode: "userPool",
    });
  }, retryConfig || READ_RETRY_CONFIG);

  return !!(existingQualResult as any).data?.getQualification;
}

/**
 * Build qualification input object
 */
function buildQualificationInput(
  qualification: any,
  pastJobId: string,
  userId: string
): any {
  return {
    id: qualification.id,
    title: qualification.title || "",
    description: qualification.description || "",
    paragraph: qualification.paragraph || "",
    question: qualification.question || "",
    userConfirmed: qualification.userConfirmed || false,
    topicId: qualification.topic?.id || qualification.topicId || "",
    userId,
    pastJobId,
  };
}

/**
 * Create a new qualification
 */
async function createQualification(
  client: any,
  qualificationInput: any,
  retryConfig?: RetryConfig
): Promise<string | null> {
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

  const createResponse = await withRetry(async () => {
    return await client.graphql({
      query: createMutation,
      variables: { input: qualificationInput },
      authMode: "userPool",
    });
  }, retryConfig || WRITE_RETRY_CONFIG);

  return (createResponse as any).data?.createQualification?.id || null;
}

/**
 * Update an existing qualification
 */
async function updateQualification(
  client: any,
  qualificationInput: any,
  retryConfig?: RetryConfig
): Promise<string | null> {
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

  const updateResponse = await withRetry(async () => {
    return await client.graphql({
      query: updateMutation,
      variables: { input: qualificationInput },
      authMode: "userPool",
    });
  }, retryConfig || WRITE_RETRY_CONFIG);

  return (updateResponse as any).data?.updateQualification?.id || null;
}

/**
 * Process a single qualification (create or update)
 */
async function processQualification(
  client: any,
  qualification: any,
  existingQualifications: any[],
  pastJobId: string,
  userId: string
): Promise<string | null> {
  // Check for similar existing qualification
  const similarExisting = existingQualifications.find((existing: any) =>
    areQualificationsSimilar(qualification, existing)
  );

  if (similarExisting) {
    return similarExisting.id;
  }

  // Ensure qualification has an ID
  if (!qualification.id) {
    qualification.id = uuidv4();
  }

  // Sanitize the qualification ID
  qualification.id = sanitizeId(qualification.id);

  // Check if qualification exists
  const qualificationExists = await checkQualificationExists(
    client,
    qualification.id
  );

  // Build input object
  const qualificationInput = buildQualificationInput(
    qualification,
    pastJobId,
    userId
  );

  // Create or update
  if (qualificationExists) {
    return await updateQualification(client, qualificationInput);
  } else {
    return await createQualification(client, qualificationInput);
  }
}

/**
 * Process all qualifications for a PastJob with parallel batch processing
 * IMPROVED: Now uses parallel batches instead of sequential processing
 */
async function processQualifications(
  client: any,
  qualifications: any[],
  pastJobId: string,
  userId: string,
  batchSize: number = 10
): Promise<string[]> {
  const processedQualificationIds: string[] = [];

  if (!qualifications || qualifications.length === 0) {
    return processedQualificationIds;
  }

  // Get existing qualifications once
  const existingQualifications = await fetchExistingQualifications(
    client,
    pastJobId
  );

  // Process qualifications in parallel batches
  for (let i = 0; i < qualifications.length; i += batchSize) {
    const batch = qualifications.slice(i, i + batchSize);

    const batchPromises = batch.map(async (qualification) => {
      try {
        return await processQualification(
          client,
          qualification,
          existingQualifications,
          pastJobId,
          userId
        );
      } catch (error) {
        const errorResult = handleError(
          "process",
          "Qualification",
          error,
          qualification.id
        );
        console.error(
          `Error processing qualification ${qualification.id}:`,
          errorResult.error
        );
        return null;
      }
    });

    // Use Promise.allSettled for fault tolerance
    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === "fulfilled" && result.value) {
        processedQualificationIds.push(result.value);
      }
    }

    // Allow garbage collection between batches
    if (typeof global !== "undefined" && global.gc) {
      global.gc();
    }
  }

  return processedQualificationIds;
}

/**
 * Fetch updated PastJob with all related data
 */
async function fetchUpdatedPastJob(
  client: any,
  pastJobId: string,
  retryConfig?: RetryConfig
): Promise<any> {
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

  const result = await withRetry(async () => {
    return await client.graphql({
      query: finalQuery,
      variables: { id: pastJobId },
      authMode: "userPool",
    });
  }, retryConfig || READ_RETRY_CONFIG);

  return (result as any).data?.getPastJob || null;
}

/**
 * Transform the PastJob data to match expected structure
 */
function transformUpdatedPastJobData(pastJobResult: any): any {
  const transformedData = {
    ...pastJobResult,
    qualifications: {
      items: (pastJobResult.qualifications?.items || []).map((qual: any) => ({
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
      })),
    },
    applications: pastJobResult.applications,
  };

  // Ensure the transformed qualifications maintain the expected structure
  if (transformedData.qualifications?.items) {
    transformedData.qualifications = transformedData.qualifications.items.map(
      (item: any) => item.qualification
    );
  }

  return transformedData;
}

/**
 * Update a PastJob record including its qualifications
 */
export async function updatePastJobWithQualifications(
  pastJobId: string,
  pastJobData: any,
  qualifications?: Array<any>
): Promise<ApiResponse<any>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize pastJobId
  const pastJobIdResult = sanitizeOrError(
    validateAndSanitizeId(pastJobId, "pastJobId")
  );
  if (!pastJobIdResult.success) return pastJobIdResult.error;
  const sanitizedPastJobId = pastJobIdResult.sanitized;

  // Validate and sanitize pastJobData
  const dataResult = sanitizeOrError(
    validateAndSanitizeObject(pastJobData, "pastJobData", {
      preserveFields: ["id", "createdAt", "updatedAt", "userId"],
      escapeHtml: false,
      maxLength: 20000,
    })
  );
  if (!dataResult.success) return dataResult.error;
  const sanitizedPastJobData = dataResult.sanitized;

  // Validate qualifications if provided
  if (qualifications !== undefined && !Array.isArray(qualifications)) {
    return {
      success: false,
      error: "Invalid qualifications: qualifications must be an array",
      statusCode: 400,
    };
  }

  return updatePastJobWithQualificationsInternal(
    sanitizedPastJobId,
    sanitizedPastJobData,
    qualifications
  );
}

/**
 * Internal function to update PastJob with qualifications (without auth check)
 * All parameters are already sanitized by the calling function
 */
async function updatePastJobWithQualificationsInternal(
  sanitizedPastJobId: string,
  sanitizedPastJobData: any,
  qualifications?: Array<any>
): Promise<ApiResponse<any>> {
  const client = generateClient();

  try {
    // Extract and clean data
    const { qualifications: qualificationsFromData, ...cleanPastJobData } =
      sanitizedPastJobData;
    const qualificationsToUse = qualifications || qualificationsFromData || [];

    // Update the basic PastJob record
    const updateResult = await updateModelRecord(
      "PastJob",
      sanitizedPastJobId,
      cleanPastJobData
    );

    if (!updateResult.success) {
      return {
        success: false,
        error: `Failed to update PastJob: ${updateResult.error}`,
        statusCode: updateResult.statusCode,
      };
    }

    // Process qualifications (now with parallel batching)
    await processQualifications(
      client,
      qualificationsToUse,
      sanitizedPastJobId,
      sanitizedPastJobData.userId
    );

    // Fetch and transform updated data
    const pastJobResult = await fetchUpdatedPastJob(client, sanitizedPastJobId);

    if (!pastJobResult) {
      return {
        success: false,
        error: `PastJob with ID: ${sanitizedPastJobId} not found after update`,
        statusCode: 404,
      };
    }

    const transformedData = transformUpdatedPastJobData(pastJobResult);

    return {
      success: true,
      data: transformedData,
      statusCode: 200,
    };
  } catch (error) {
    const errorResult = handleError(
      "update",
      "PastJob with qualifications",
      error,
      sanitizedPastJobId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}
