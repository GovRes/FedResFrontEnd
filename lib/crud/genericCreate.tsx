import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import {
  validateAndSanitizeModelName,
  validateAndSanitizeObject,
  validateAndSanitizeArray,
  sanitizeOrError,
  sanitizeId,
} from "../utils/validators";
import {
  getRetryConfigForOperation,
  HTTP_STATUS,
  RETRY_CONFIG,
} from "../utils/constants";
import { withRetry, withBatchRetry, RetryConfig } from "../utils/retry";
import { ApiResponse } from "../utils/api";

// Retry configuration for GraphQL operations
const GRAPHQL_RETRY_CONFIG = getRetryConfigForOperation("write");

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
 * Generic function to create any model type in the database
 * Now includes retry logic for transient failures
 *
 * @param {string} modelName - The name of the model to create (e.g., "Education", "PastJob")
 * @param {Object} input - The input object with the model's fields
 * @param {string} userId - Optional user ID to add to the record
 * @param {RetryConfig} retryConfig - Optional custom retry configuration
 * @returns {Promise<ApiResponse>} - The API response with created record data
 */
export async function createModelRecord(
  modelName: string,
  input: object,
  userId?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize input object
  const inputResult = sanitizeOrError(
    validateAndSanitizeObject(input, "input", {
      preserveFields: ["id", "createdAt", "updatedAt", "userId", "jobId"],
      escapeHtml: false,
      maxLength: 10000,
    })
  );
  if (!inputResult.success) return inputResult.error;
  const sanitizedInput = inputResult.sanitized;

  const client = generateClient();

  // Extract fields we don't want to include in the create operation
  const { createdAt, id, qualifications, updatedAt, ...filteredUpdateData } =
    sanitizedInput as any;

  // Add userId to the input object if provided, and sanitize it
  if (userId) {
    filteredUpdateData.userId = sanitizeId(userId);
  }

  try {
    const fragmentName = getFragmentForModel(sanitizedModelName);

    // Create the GraphQL mutation query using fragments
    const mutation = buildQueryWithFragments(`
      mutation Create${sanitizedModelName}($input: Create${sanitizedModelName}Input!) {
        create${sanitizedModelName}(input: $input) {
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
      }
    `);

    const createResult = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: filteredUpdateData,
        },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    // Verify successful creation
    if (
      "data" in createResult &&
      createResult.data?.[`create${sanitizedModelName}`]
    ) {
      return {
        success: true,
        data: createResult.data[`create${sanitizedModelName}`],
        statusCode: HTTP_STATUS.CREATED,
      };
    } else {
      return {
        success: false,
        error: `Failed to create ${sanitizedModelName} record`,
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      };
    }
  } catch (error) {
    const errorResult = handleError("create", sanitizedModelName, error);
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Helper function for batch creation of multiple records of the same model type
 * Now uses retry logic for individual items that fail with transient errors
 *
 * @param {string} modelName - The name of the model to create (e.g., "Education", "PastJob")
 * @param {Object[]} inputs - Array of input objects with model fields
 * @param {string} userId - Optional user ID to add to all records
 * @param {RetryConfig} retryConfig - Optional custom retry configuration
 * @returns {Promise<ApiResponse<{created: any[], failed: {input: any, error: string}[]}>>} - API response with created records and any failures
 */
export async function batchCreateModelRecords(
  modelName: string,
  inputs: object[],
  userId?: string,
  retryConfig?: RetryConfig
): Promise<
  ApiResponse<{ created: any[]; failed: { input: any; error: string }[] }>
> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize inputs array
  const inputsResult = sanitizeOrError(
    validateAndSanitizeArray(inputs, "inputs", (input) => {
      const sanitized = validateAndSanitizeObject(input, "input", {
        preserveFields: ["id", "createdAt", "updatedAt", "userId", "jobId"],
        escapeHtml: false,
        maxLength: 10000,
      });
      return sanitized.isValid ? sanitized.sanitized : input;
    })
  );
  if (!inputsResult.success) return inputsResult.error;
  const sanitizedInputs = inputsResult.sanitized;

  // Sanitize userId if provided
  const sanitizedUserId = userId ? sanitizeId(userId) : undefined;

  // Use batch retry utility for processing items
  const { successful, failed } = await withBatchRetry(
    sanitizedInputs,
    async (input) => {
      const result = await createModelRecordInternal(
        sanitizedModelName,
        input,
        sanitizedUserId,
        retryConfig
      );

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(
          result.error || `Failed to create ${sanitizedModelName} record`
        );
      }
    },
    retryConfig || GRAPHQL_RETRY_CONFIG
  );

  const created = successful;
  const failedWithInputs = failed.map(({ item, error }) => ({
    input: item,
    error: error?.message || error?.error || String(error),
  }));

  // Determine overall success status
  const hasCreated = created.length > 0;
  const hasFailed = failedWithInputs.length > 0;
  const allFailed = failedWithInputs.length === sanitizedInputs.length;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to create all ${sanitizedInputs.length} ${sanitizedModelName} records`,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      data: { created, failed: failedWithInputs },
    };
  }

  return {
    success: hasCreated,
    data: { created, failed: failedWithInputs },
    statusCode: hasCreated
      ? HTTP_STATUS.CREATED
      : HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ...(hasFailed && {
      error: `${failedWithInputs.length} of ${sanitizedInputs.length} ${sanitizedModelName} records failed to create`,
    }),
  };
}

/**
 * Internal create function without auth check (for batch operations)
 * Input is already sanitized by the calling function
 * Now includes retry logic for transient failures
 */
async function createModelRecordInternal(
  sanitizedModelName: string,
  sanitizedInput: object,
  sanitizedUserId?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const client = generateClient();

  try {
    const { createdAt, id, qualifications, updatedAt, ...filteredUpdateData } =
      sanitizedInput as any;

    if (sanitizedUserId) {
      filteredUpdateData.userId = sanitizedUserId;
    }

    const fragmentName = getFragmentForModel(sanitizedModelName);

    const mutation = buildQueryWithFragments(`
      mutation Create${sanitizedModelName}($input: Create${sanitizedModelName}Input!) {
        create${sanitizedModelName}(input: $input) {
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
      }
    `);

    // Execute with retry logic
    const createResult = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: filteredUpdateData,
        },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    if (
      "data" in createResult &&
      createResult.data?.[`create${sanitizedModelName}`]
    ) {
      return {
        success: true,
        data: createResult.data[`create${sanitizedModelName}`],
        statusCode: HTTP_STATUS.CREATED,
      };
    } else {
      return {
        success: false,
        error: `Failed to create ${sanitizedModelName} record`,
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      };
    }
  } catch (error) {
    const errorResult = handleError("create", sanitizedModelName, error);
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Create multiple records with circuit breaker pattern
 * Prevents cascading failures during high error rates
 *
 * @param {string} modelName - The name of the model to create
 * @param {Object[]} inputs - Array of input objects with model fields
 * @param {string} userId - Optional user ID to add to all records
 * @returns {Promise<ApiResponse>} - API response with created records and failures
 */
export async function batchCreateWithCircuitBreaker(
  modelName: string,
  inputs: object[],
  userId?: string
): Promise<
  ApiResponse<{ created: any[]; failed: { input: any; error: string }[] }>
> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize inputs
  const inputsResult = sanitizeOrError(
    validateAndSanitizeArray(inputs, "inputs", (input) => {
      const sanitized = validateAndSanitizeObject(input, "input", {
        preserveFields: ["id", "createdAt", "updatedAt", "userId", "jobId"],
        escapeHtml: false,
        maxLength: 10000,
      });
      return sanitized.isValid ? sanitized.sanitized : input;
    })
  );
  if (!inputsResult.success) return inputsResult.error;
  const sanitizedInputs = inputsResult.sanitized;

  const sanitizedUserId = userId ? sanitizeId(userId) : undefined;

  const created: any[] = [];
  const failed: Array<{ input: any; error: string }> = [];

  // Process with aggressive retry for initial items
  const aggressiveRetryConfig: RetryConfig = {
    maxAttempts: RETRY_CONFIG.AGGRESSIVE_MAX_ATTEMPTS,
    baseDelay: RETRY_CONFIG.AGGRESSIVE_BASE_DELAY,
    maxDelay: RETRY_CONFIG.AGGRESSIVE_MAX_DELAY,
  };

  // After threshold failures, switch to conservative retry
  let consecutiveFailures = 0;
  const conservativeRetryConfig: RetryConfig = {
    maxAttempts: RETRY_CONFIG.CONSERVATIVE_MAX_ATTEMPTS,
    baseDelay: RETRY_CONFIG.CONSERVATIVE_BASE_DELAY,
    maxDelay: RETRY_CONFIG.CONSERVATIVE_MAX_DELAY,
  };

  const failureThreshold = RETRY_CONFIG.BATCH_CONSECUTIVE_FAILURE_THRESHOLD;

  for (const input of sanitizedInputs) {
    try {
      // Choose retry strategy based on recent failures
      const retryConfig =
        consecutiveFailures >= 3
          ? conservativeRetryConfig
          : aggressiveRetryConfig;

      const result = await createModelRecordInternal(
        sanitizedModelName,
        input,
        sanitizedUserId,
        retryConfig
      );

      if (result.success && result.data) {
        created.push(result.data);
        consecutiveFailures = 0; // Reset on success
      } else {
        consecutiveFailures++;
        failed.push({
          input,
          error:
            result.error || `Failed to create ${sanitizedModelName} record`,
        });

        // If too many consecutive failures, stop processing
        if (consecutiveFailures >= failureThreshold) {
          console.error(
            `Stopping batch creation after ${consecutiveFailures} consecutive failures`
          );

          // Add remaining items to failed list
          const remainingIndex = sanitizedInputs.indexOf(input) + 1;
          for (let i = remainingIndex; i < sanitizedInputs.length; i++) {
            failed.push({
              input: sanitizedInputs[i],
              error: "Batch creation halted due to too many failures",
            });
          }
          break;
        }
      }
    } catch (error) {
      consecutiveFailures++;
      const errorResult = handleError("create", sanitizedModelName, error);
      failed.push({
        input,
        error: errorResult.error,
      });
    }
  }

  const hasCreated = created.length > 0;
  const hasFailed = failed.length > 0;
  const allFailed = failed.length === sanitizedInputs.length;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to create all ${sanitizedInputs.length} ${sanitizedModelName} records`,
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    };
  }

  return {
    success: hasCreated,
    data: { created, failed },
    statusCode: hasCreated
      ? HTTP_STATUS.CREATED
      : HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ...(hasFailed && {
      error: `${failed.length} of ${sanitizedInputs.length} ${sanitizedModelName} records failed to create`,
    }),
  };
}
