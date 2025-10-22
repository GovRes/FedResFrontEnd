import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import {
  validateAndSanitizeModelName,
  validateAndSanitizeId,
  sanitizeOrError,
  validateLimit,
  validateModelHasUserId,
  validateOrError,
} from "../utils/validators";
import { withRetry, RetryConfig } from "../utils/retry";
import { getRetryConfigForOperation } from "../utils/constants";
import { ApiResponse } from "../utils/api";
const GRAPHQL_RETRY_CONFIG = getRetryConfigForOperation();

function getFragmentForModel(modelName: string): string {
  const fragmentMap: Record<string, string> = {
    Application: "ApplicationFields",
    Award: "AwardFields",
    Education: "EducationFields",
    Job: "JobDetailedFields",
    Resume: "ResumeFields",
    Topic: "TopicFields",
    PastJob: "PastJobFields",
    Qualification: "QualificationFields",
    AwardApplication: "AwardApplicationFields",
    EducationApplication: "EducationApplicationFields",
    QualificationApplication: "QualificationApplicationFields",
    PastJobApplication: "PastJobApplicationFields",
    PastJobQualification: "PastJobApplicationFields",
  };

  return fragmentMap[modelName] || "";
}

/**
 * Generic function to fetch all records of a model type for a specific user
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "PastJob")
 * @param {string} userId - The user ID to filter by
 * @param {number} limit - Optional limit for the number of records to fetch
 * @param {string} nextToken - Optional pagination token
 * @returns {Promise<ApiResponse<{items: Object[], nextToken?: string}>>} - API response with array of fetched records and next pagination token if available
 */
export async function listUserModelRecords(
  modelName: string,
  userId: string,
  limit?: number,
  nextToken?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate that model has userId field
  const modelHasUserIdValidation = validateOrError(
    validateModelHasUserId(sanitizedModelName)
  );
  if (modelHasUserIdValidation) return modelHasUserIdValidation;

  // Validate and sanitize userId
  const userIdResult = sanitizeOrError(validateAndSanitizeId(userId, "userId"));
  if (!userIdResult.success) return userIdResult.error;
  const sanitizedUserId = userIdResult.sanitized;

  // Validate limit (no sanitization needed for numbers)
  if (limit !== undefined) {
    const limitValidation = validateOrError(validateLimit(limit));
    if (limitValidation) return limitValidation;
  }

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
    const fragmentName = getFragmentForModel(sanitizedModelName);

    // Create the GraphQL query using fragments
    const query = buildQueryWithFragments(`
      query List${sanitizedModelName}sByUserId($filter: Model${sanitizedModelName}FilterInput, $limit: Int, $nextToken: String) {
        list${sanitizedModelName}s(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ${
              fragmentName
                ? `...${fragmentName}`
                : `
              id
              createdAt
              updatedAt
            `
            }
          }
          nextToken
        }
      }
    `);

    // Create a filter to get only records for this user
    const filter = {
      userId: { eq: sanitizedUserId },
    };

    // Execute the GraphQL query
    const listResult = await withRetry(async () => {
      return await client.graphql({
        query: query,
        variables: {
          filter,
          limit,
          nextToken: sanitizedNextToken,
        },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    // Verify successful fetch
    if (
      "data" in listResult &&
      listResult.data?.[`list${sanitizedModelName}s`]
    ) {
      return {
        success: true,
        data: {
          items: listResult.data[`list${sanitizedModelName}s`].items || [],
          nextToken: listResult.data[`list${sanitizedModelName}s`].nextToken,
        },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `Failed to list ${sanitizedModelName} records for user ${sanitizedUserId}`,
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "list",
      `${sanitizedModelName} for user`,
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
 * Generic function to fetch all user records across multiple models
 *
 * @param {string[]} modelNames - Array of model names to fetch (e.g., ["Education", "PastJob"])
 * @param {string} userId - The user ID to filter by
 * @param {number} limit - Optional limit for each model type (applied per model)
 * @returns {Promise<ApiResponse<Record<string, any[]> & {_errors?: string[]}>>} - API response with object containing model names as keys and arrays of records as values, plus any errors encountered
 */
export async function listAllUserRecords(
  modelNames: string[],
  userId: string,
  limit?: number
): Promise<ApiResponse<Record<string, any[]> & { _errors?: string[] }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate that modelNames is a non-empty array
  if (!Array.isArray(modelNames) || modelNames.length === 0) {
    return {
      success: false,
      error: "Invalid modelNames: modelNames must be a non-empty array",
      statusCode: 400,
    };
  }

  // Sanitize each model name in the array
  const sanitizedModelNames: string[] = [];
  for (const modelName of modelNames) {
    const modelResult = validateAndSanitizeModelName(modelName);
    if (!modelResult.isValid) {
      return {
        success: false,
        error: `Invalid model name: ${modelName}. ${modelResult.error}`,
        statusCode: 400,
      };
    }
    sanitizedModelNames.push(modelResult.sanitized);
  }

  // Validate and sanitize userId
  const userIdResult = sanitizeOrError(validateAndSanitizeId(userId, "userId"));
  if (!userIdResult.success) return userIdResult.error;
  const sanitizedUserId = userIdResult.sanitized;

  // Validate limit (no sanitization needed for numbers)
  if (limit !== undefined) {
    const limitValidation = validateOrError(validateLimit(limit));
    if (limitValidation) return limitValidation;
  }

  const results: Record<string, any[]> = {};
  const errors: string[] = [];

  // Process models in parallel for better performance
  const fetchPromises = sanitizedModelNames.map(async (modelName) => {
    try {
      // Use internal function to avoid double auth check
      // All parameters are already sanitized
      const response = await listUserModelRecordsInternal(
        modelName,
        sanitizedUserId,
        limit
      );
      if (response.success && response.data) {
        results[modelName] = response.data.items;
      } else {
        errors.push(`Failed to fetch ${modelName}: ${response.error}`);
      }
    } catch (error) {
      const errorResult = handleError(
        "list",
        modelName,
        error,
        sanitizedUserId
      );
      errors.push(`Failed to fetch ${modelName}: ${errorResult.error}`);
    }
  });

  // Wait for all promises to resolve
  await Promise.all(fetchPromises);

  // Prepare the response data
  const responseData = { ...results };
  if (errors.length > 0) {
    responseData._errors = errors;
  }

  // Determine success status and status code
  const hasResults = Object.keys(results).length > 0;
  const allFailed = Object.keys(results).length === 0 && errors.length > 0;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to fetch records for all requested models: ${errors.join(", ")}`,
      statusCode: 500,
    };
  }

  return {
    success: true,
    data: responseData,
    statusCode: 200,
    ...(errors.length > 0 && {
      error: `Some models failed to fetch: ${errors.join(", ")}`,
    }),
  };
}

/**
 * Internal function for listing user records without auth check (for batch operations)
 * This prevents double authentication checks when called from listAllUserRecords
 * All parameters are already sanitized by the calling function
 */
async function listUserModelRecordsInternal(
  sanitizedModelName: string,
  sanitizedUserId: string,
  limit?: number,
  nextToken?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  // Validate that model has userId field
  const modelHasUserIdValidation = validateOrError(
    validateModelHasUserId(sanitizedModelName)
  );
  if (modelHasUserIdValidation) return modelHasUserIdValidation;

  const client = generateClient();

  try {
    const fragmentName = getFragmentForModel(sanitizedModelName);

    // Create the GraphQL query using fragments
    const query = buildQueryWithFragments(`
      query List${sanitizedModelName}sByUserId($filter: Model${sanitizedModelName}FilterInput, $limit: Int, $nextToken: String) {
        list${sanitizedModelName}s(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ${
              fragmentName
                ? `...${fragmentName}`
                : `
              id
              createdAt
              updatedAt
            `
            }
          }
          nextToken
        }
      }
    `);

    // Create a filter to get only records for this user
    const filter = {
      userId: { eq: sanitizedUserId },
    };

    // Execute the GraphQL query
    const listResult = await withRetry(async () => {
      return await client.graphql({
        query: query,
        variables: {
          filter,
          limit,
          nextToken,
        },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    // Verify successful fetch
    if (
      "data" in listResult &&
      listResult.data?.[`list${sanitizedModelName}s`]
    ) {
      return {
        success: true,
        data: {
          items: listResult.data[`list${sanitizedModelName}s`].items || [],
          nextToken: listResult.data[`list${sanitizedModelName}s`].nextToken,
        },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `Failed to list ${sanitizedModelName} records for user ${sanitizedUserId}`,
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "list",
      `${sanitizedModelName} for user`,
      error,
      sanitizedUserId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}
