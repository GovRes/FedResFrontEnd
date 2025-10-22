import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import {
  validateAndSanitizeId,
  validateAndSanitizeNonEmptyString,
  validateAndSanitizeObject,
  sanitizeOrError,
  validateLimit,
  validateOrError,
} from "../utils/validators";
import { withRetry, RetryConfig } from "../utils/retry";

import { QUERY_LIMITS, getRetryConfigForOperation } from "../utils/constants";
import { ApiResponse } from "../utils/api";
const DEFAULT_RETRY_CONFIG = getRetryConfigForOperation();
const READ_RETRY_CONFIG = getRetryConfigForOperation("read");
const WRITE_RETRY_CONFIG = getRetryConfigForOperation("write");
/**
 * Fetch a single Qualification record with all its applications and jobs
 */
export async function fetchQualificationWithApplicationsAndJobs(
  qualificationId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<any>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize qualificationId
  const qualIdResult = sanitizeOrError(
    validateAndSanitizeId(qualificationId, "qualificationId")
  );
  if (!qualIdResult.success) return qualIdResult.error;
  const sanitizedQualificationId = qualIdResult.sanitized;

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query GetQualification($id: ID!) {
        getQualification(id: $id) {
          ...QualificationFields
          topic {
            ...TopicWithJobFields
            job {
              ...JobDetailedFields
            }
          }
          user {
            ...UserBasicFields
          }
          applications {
            items {
              ...QualificationApplicationFields
              application {
                ...ApplicationWithJobDetailedFields
                job {
                  ...JobDetailedFields
                }
              }
            }
          }
          pastJob {
            id
            title
            organization
            type
            startDate
            endDate
          }
        }
      }
    `);

    const result = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: { id: sanitizedQualificationId },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if ("data" in result && result.data?.getQualification) {
      const qualification = result.data.getQualification;

      // Transform applications data for consistency
      const transformedData = {
        ...qualification,
        applications:
          qualification.applications?.items?.map((item: any) => ({
            id: item.application?.id,
            status: item.application?.status,
            completedSteps: item.application?.completedSteps,
            jobId: item.application?.jobId,
            createdAt: item.application?.createdAt,
            updatedAt: item.application?.updatedAt,
            job: item.application?.job,
            user: item.application?.user,
          })) || [],
        // pastJob is now a direct relationship, not an array
        pastJob: qualification.pastJob || null,
      };

      return {
        success: true,
        data: transformedData,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `Qualification with ID: ${sanitizedQualificationId} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "Qualification with applications and jobs",
      error,
      sanitizedQualificationId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Fetch multiple Qualification records with applications and jobs for a user
 */
export async function fetchUserQualificationsWithApplicationsAndJobs(
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
      query ListQualifications($filter: ModelQualificationFilterInput, $limit: Int, $nextToken: String) {
        listQualifications(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ...QualificationFields
            topic {
              ...TopicWithJobFields
            }
            applications {
              items {
                ...QualificationApplicationFields
                application {
                  ...ApplicationWithJobDetailedFields
                  job {
                    ...JobDetailedFields
                  }
                }
              }
            }
            pastJob {
              id
              title
              organization
              type
              startDate
              endDate
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

    if ("data" in result && result.data?.listQualifications) {
      const { items, nextToken: responseNextToken } =
        result.data.listQualifications;

      // Transform the data for consistency
      const transformedItems =
        items?.map((qualification: any) => ({
          ...qualification,
          applications:
            qualification.applications?.items?.map((item: any) => ({
              id: item.application?.id,
              status: item.application?.status,
              completedSteps: item.application?.completedSteps,
              jobId: item.application?.jobId,
              createdAt: item.application?.createdAt,
              updatedAt: item.application?.updatedAt,
              job: item.application?.job,
              user: item.application?.user,
            })) || [],
          // pastJob is now a direct relationship
          pastJob: qualification.pastJob || null,
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
        error: `No Qualifications found for user: ${sanitizedUserId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "user Qualifications with applications and jobs",
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
 * Fetch qualifications for a specific past job
 */
export async function fetchQualificationsForPastJob(
  pastJobId: string,
  limit: number = QUERY_LIMITS.DEFAULT_LIST_LIMIT,
  nextToken?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
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
      query ListQualifications($filter: ModelQualificationFilterInput, $limit: Int, $nextToken: String) {
        listQualifications(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ...QualificationWithPastJobFields
            applications {
              items {
                ...QualificationApplicationFields
                application {
                  ...ApplicationWithJobFields
                }
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
          filter: { pastJobId: { eq: sanitizedPastJobId } },
          limit,
          nextToken: sanitizedNextToken,
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if ("data" in result && result.data?.listQualifications) {
      const { items, nextToken: responseNextToken } =
        result.data.listQualifications;

      // Transform applications data
      const transformedItems =
        items?.map((qualification: any) => ({
          ...qualification,
          applications:
            qualification.applications?.items?.map((item: any) => ({
              id: item.application?.id,
              status: item.application?.status,
              completedSteps: item.application?.completedSteps,
              jobId: item.application?.jobId,
              job: item.application?.job,
              user: item.application?.user,
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
        error: `No Qualifications found for pastJob: ${sanitizedPastJobId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "Qualifications for past job",
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
 * Fetch qualifications for a specific topic
 */
export async function fetchQualificationsForTopic(
  topicId: string,
  limit: number = QUERY_LIMITS.DEFAULT_LIST_LIMIT,
  nextToken?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize topicId
  const topicIdResult = sanitizeOrError(
    validateAndSanitizeId(topicId, "topicId")
  );
  if (!topicIdResult.success) return topicIdResult.error;
  const sanitizedTopicId = topicIdResult.sanitized;

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
      query ListQualifications($filter: ModelQualificationFilterInput, $limit: Int, $nextToken: String) {
        listQualifications(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ...QualificationWithTopicFields
            pastJob {
              id
              title
              organization
              startDate
              endDate
            }
            applications {
              items {
                ...QualificationApplicationFields
                application {
                  ...ApplicationWithJobFields
                }
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
          filter: { topicId: { eq: sanitizedTopicId } },
          limit,
          nextToken: sanitizedNextToken,
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if ("data" in result && result.data?.listQualifications) {
      const { items, nextToken: responseNextToken } =
        result.data.listQualifications;

      // Transform applications data
      const transformedItems =
        items?.map((qualification: any) => ({
          ...qualification,
          applications:
            qualification.applications?.items?.map((item: any) => ({
              id: item.application?.id,
              status: item.application?.status,
              completedSteps: item.application?.completedSteps,
              jobId: item.application?.jobId,
              job: item.application?.job,
              user: item.application?.user,
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
        error: `No Qualifications found for topic: ${sanitizedTopicId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "Qualifications for topic",
      error,
      sanitizedTopicId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Create a new qualification
 */
export async function createQualification(
  qualificationData: {
    title: string;
    description: string;
    paragraph?: string;
    question?: string;
    userConfirmed?: boolean;
    conversationThreadId?: string;
    topicId: string;
    userId: string;
    pastJobId?: string;
  },
  retryConfig?: RetryConfig
): Promise<ApiResponse<any>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize the entire qualificationData object first
  const dataResult = sanitizeOrError(
    validateAndSanitizeObject(qualificationData, "qualificationData", {
      preserveFields: ["id", "createdAt", "updatedAt"],
      escapeHtml: false,
      maxLength: 10000,
    })
  );
  if (!dataResult.success) return dataResult.error;
  const sanitizedData = dataResult.sanitized;

  // Validate and sanitize required fields
  const titleResult = sanitizeOrError(
    validateAndSanitizeNonEmptyString(sanitizedData.title, "title", {
      escapeHtml: false,
      maxLength: 500,
    })
  );
  if (!titleResult.success) return titleResult.error;

  const descriptionResult = sanitizeOrError(
    validateAndSanitizeNonEmptyString(
      sanitizedData.description,
      "description",
      {
        escapeHtml: false,
        maxLength: 5000,
      }
    )
  );
  if (!descriptionResult.success) return descriptionResult.error;

  const topicIdResult = sanitizeOrError(
    validateAndSanitizeId(sanitizedData.topicId, "topicId")
  );
  if (!topicIdResult.success) return topicIdResult.error;

  const userIdResult = sanitizeOrError(
    validateAndSanitizeId(sanitizedData.userId, "userId")
  );
  if (!userIdResult.success) return userIdResult.error;

  // Validate optional pastJobId if provided
  let sanitizedPastJobId = sanitizedData.pastJobId;
  if (sanitizedPastJobId) {
    const pastJobIdResult = sanitizeOrError(
      validateAndSanitizeId(sanitizedPastJobId, "pastJobId")
    );
    if (!pastJobIdResult.success) return pastJobIdResult.error;
    sanitizedPastJobId = pastJobIdResult.sanitized;
  }

  const client = generateClient();

  try {
    const mutation = buildQueryWithFragments(`
      mutation CreateQualification($input: CreateQualificationInput!) {
        createQualification(input: $input) {
          ...QualificationWithTopicFields
        }
      }
    `);

    const result = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: {
            title: titleResult.sanitized,
            description: descriptionResult.sanitized,
            paragraph: sanitizedData.paragraph || "",
            question: sanitizedData.question || "",
            userConfirmed: sanitizedData.userConfirmed || false,
            conversationThreadId: sanitizedData.conversationThreadId,
            topicId: topicIdResult.sanitized,
            userId: userIdResult.sanitized,
            pastJobId: sanitizedPastJobId,
          },
        },
        authMode: "userPool",
      });
    }, retryConfig || WRITE_RETRY_CONFIG);
    if ("data" in result && result.data?.createQualification) {
      return {
        success: true,
        data: result.data.createQualification,
        statusCode: 201,
      };
    } else {
      return {
        success: false,
        error: "Unexpected response format from GraphQL operation",
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError("create", "Qualification", error);
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Update an existing qualification
 */
export async function updateQualification(
  qualificationId: string,
  updates: {
    title?: string;
    description?: string;
    paragraph?: string;
    question?: string;
    userConfirmed?: boolean;
    conversationThreadId?: string;
    topicId?: string;
    pastJobId?: string;
  },
  retryConfig?: RetryConfig
): Promise<ApiResponse<any>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize qualificationId
  const qualIdResult = sanitizeOrError(
    validateAndSanitizeId(qualificationId, "qualificationId")
  );
  if (!qualIdResult.success) return qualIdResult.error;
  const sanitizedQualificationId = qualIdResult.sanitized;

  // Validate and sanitize updates object
  const updatesResult = sanitizeOrError(
    validateAndSanitizeObject(updates, "updates", {
      preserveFields: [],
      escapeHtml: false,
      maxLength: 10000,
    })
  );
  if (!updatesResult.success) return updatesResult.error;
  const sanitizedUpdates = updatesResult.sanitized;

  if (!sanitizedUpdates || Object.keys(sanitizedUpdates).length === 0) {
    return {
      success: false,
      error: "At least one field to update is required",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const mutation = buildQueryWithFragments(`
      mutation UpdateQualification($input: UpdateQualificationInput!) {
        updateQualification(input: $input) {
          ...QualificationWithTopicFields
        }
      }
    `);

    const result = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: {
            id: sanitizedQualificationId,
            ...sanitizedUpdates,
          },
        },
        authMode: "userPool",
      });
    }, retryConfig || WRITE_RETRY_CONFIG);

    if ("data" in result && result.data?.updateQualification) {
      return {
        success: true,
        data: result.data.updateQualification,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: "Unexpected response format from GraphQL operation",
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "update",
      "Qualification",
      error,
      sanitizedQualificationId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Delete a qualification
 */
export async function deleteQualification(
  qualificationId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<any>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize qualificationId
  const qualIdResult = sanitizeOrError(
    validateAndSanitizeId(qualificationId, "qualificationId")
  );
  if (!qualIdResult.success) return qualIdResult.error;
  const sanitizedQualificationId = qualIdResult.sanitized;

  const client = generateClient();

  try {
    const mutation = buildQueryWithFragments(`
      mutation DeleteQualification($input: DeleteQualificationInput!) {
        deleteQualification(input: $input) {
          ...QualificationFields
        }
      }
    `);

    const result = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: { id: sanitizedQualificationId },
        },
        authMode: "userPool",
      });
    }, retryConfig || DEFAULT_RETRY_CONFIG);

    if ("data" in result && result.data?.deleteQualification) {
      return {
        success: true,
        data: result.data.deleteQualification,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: "Unexpected response format from GraphQL operation",
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "delete",
      "Qualification",
      error,
      sanitizedQualificationId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}
