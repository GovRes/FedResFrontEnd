import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import {
  validateAndSanitizeModelName,
  validateAndSanitizeId,
  validateAndSanitizeIdArray,
  validateAndSanitizeObject,
  sanitizeOrError,
  validateBatchSize,
  validateOrError,
} from "../utils/validators";
import {
  HTTP_STATUS,
  BATCH_CONFIG,
  getRetryConfigForOperation,
} from "../utils/constants";
import { withRetry, withBatchRetry, RetryConfig } from "../utils/retry";
import { ApiResponse } from "../utils/api";
const DEFAULT_RETRY_CONFIG = getRetryConfigForOperation();
/**
 * Generic function to delete any model type from the database
 *
 * @param {string} modelName - The name of the model to delete (e.g., "Education", "PastJob")
 * @param {string} id - The ID of the record to delete
 * @returns {Promise<ApiResponse>} - The API response with deleted record data
 */
export async function deleteModelRecord(
  modelName: string,
  id: string,
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

  // Validate and sanitize ID
  const idResult = sanitizeOrError(validateAndSanitizeId(id, "id"));
  if (!idResult.success) return idResult.error;
  const sanitizedId = idResult.sanitized;

  const client = generateClient();

  try {
    // Create the GraphQL mutation query using fragments
    const mutation = buildQueryWithFragments(`
      mutation Delete${sanitizedModelName}($input: Delete${sanitizedModelName}Input!) {
        delete${sanitizedModelName}(input: $input) {
          id
          createdAt
          updatedAt
        }
      }
    `);

    // Execute the GraphQL mutation
    const deleteResult = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: { id: sanitizedId },
        },
        authMode: "userPool",
      });
    }, retryConfig || DEFAULT_RETRY_CONFIG);

    // Verify successful deletion
    if (
      "data" in deleteResult &&
      deleteResult.data?.[`delete${sanitizedModelName}`]
    ) {
      return {
        success: true,
        data: deleteResult.data[`delete${sanitizedModelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${sanitizedModelName} record with ID: ${sanitizedId} not found or could not be deleted`,
        statusCode: HTTP_STATUS.NOT_FOUND,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "delete",
      sanitizedModelName,
      error,
      sanitizedId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

export async function batchDeleteModelRecords(
  modelName: string,
  ids: string[],
  retryConfig?: RetryConfig // ✅ Add optional retry config
): Promise<
  ApiResponse<{ deleted: any[]; failed: { id: string; error: string }[] }>
> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize IDs array
  const idsResult = sanitizeOrError(validateAndSanitizeIdArray(ids, "ids"));
  if (!idsResult.success) return idsResult.error;
  const sanitizedIds = idsResult.sanitized;

  const { successful, failed } = await withBatchRetry(
    sanitizedIds,
    async (id) => {
      const result = await deleteModelRecordInternal(sanitizedModelName, id);

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(
          result.error || `Failed to delete ${sanitizedModelName} record`
        );
      }
    },
    retryConfig || DEFAULT_RETRY_CONFIG
  );

  // ✅ Map withBatchRetry results to expected format
  const deleted = successful;
  const failedWithDetails = failed.map(({ item, error }) => ({
    id: item,
    error: error?.message || String(error),
  }));

  // Determine overall success status
  const hasDeleted = deleted.length > 0;
  const hasFailed = failedWithDetails.length > 0;
  const allFailed = failedWithDetails.length === sanitizedIds.length;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to delete all ${sanitizedIds.length} ${sanitizedModelName} records`,
      statusCode: 500,
    };
  }

  return {
    success: hasDeleted,
    data: { deleted, failed: failedWithDetails },
    statusCode: hasDeleted ? 200 : 500,
    ...(hasFailed && {
      error: `${failedWithDetails.length} of ${sanitizedIds.length} ${sanitizedModelName} records failed to delete`,
    }),
  };
}

/**
 * Internal delete function without auth check (for batch operations)
 * This prevents double authentication checks in batch operations
 * ID is already sanitized by the calling function
 */
async function deleteModelRecordInternal(
  sanitizedModelName: string,
  sanitizedId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const client = generateClient();

  try {
    // Create the GraphQL mutation query using fragments
    const mutation = buildQueryWithFragments(`
      mutation Delete${sanitizedModelName}($input: Delete${sanitizedModelName}Input!) {
        delete${sanitizedModelName}(input: $input) {
          id
          createdAt
          updatedAt
        }
      }
    `);

    // Execute the GraphQL mutation
    const deleteResult = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: { id: sanitizedId },
        },
        authMode: "userPool",
      });
    }, retryConfig || DEFAULT_RETRY_CONFIG);
    // Verify successful deletion
    if (
      "data" in deleteResult &&
      deleteResult.data?.[`delete${sanitizedModelName}`]
    ) {
      return {
        success: true,
        data: deleteResult.data[`delete${sanitizedModelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${sanitizedModelName} record with ID: ${sanitizedId} not found or could not be deleted`,
        statusCode: HTTP_STATUS.NOT_FOUND,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "delete",
      sanitizedModelName,
      error,
      sanitizedId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Core function for bulk deletion with optional filtering
 * This is the unified implementation used by both deleteAllModelRecords and deleteAllUserModelRecords
 * Filter object is already sanitized by calling function
 */
async function bulkDeleteRecords(
  sanitizedModelName: string,
  sanitizedFilter: any = null,
  batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE,
  logContext: string = "",
  retryConfig?: RetryConfig
): Promise<
  ApiResponse<{ deletedCount: number; errors: { id: string; error: string }[] }>
> {
  // NOTE: Auth check is done at the public function level before calling this internal function
  const client = generateClient();

  let deletedCount = 0;
  let errors: { id: string; error: string }[] = [];
  let nextToken: string | null = null;

  try {
    console.log(
      `Starting deletion of ${sanitizedModelName} records${logContext}...`
    );

    do {
      // Build the appropriate query based on whether we have a filter
      const listQuery = sanitizedFilter
        ? buildQueryWithFragments(`
          query List${sanitizedModelName}s($filter: Model${sanitizedModelName}FilterInput, $limit: Int, $nextToken: String) {
            list${sanitizedModelName}s(filter: $filter, limit: $limit, nextToken: $nextToken) {
              items {
                id
              }
              nextToken
            }
          }
        `)
        : buildQueryWithFragments(`
          query List${sanitizedModelName}s($limit: Int, $nextToken: String) {
            list${sanitizedModelName}s(limit: $limit, nextToken: $nextToken) {
              items {
                id
              }
              nextToken
            }
          }
        `);

      const variables = sanitizedFilter
        ? { filter: sanitizedFilter, limit: batchSize, nextToken }
        : { limit: batchSize, nextToken };

      const listResult: any = await withRetry(async () => {
        return await client.graphql({
          query: listQuery,
          variables,
          authMode: "userPool",
        });
      }, retryConfig || DEFAULT_RETRY_CONFIG);
      if ("data" in listResult && listResult.data) {
        const listData = (listResult.data as any)[`list${sanitizedModelName}s`];
        if (listData) {
          const items = listData.items;
          nextToken = listData.nextToken;

          if (items.length === 0) {
            break; // No more records to delete
          }

          // Delete each record in the current batch
          for (const item of items) {
            try {
              // Use internal function to avoid auth check for each item
              // IDs from database are already trusted
              const deleteResult = await deleteModelRecordInternal(
                sanitizedModelName,
                item.id
              );
              if (deleteResult.success) {
                deletedCount++;

                // Log progress for large operations
                if (deletedCount % BATCH_CONFIG.PROGRESS_LOG_INTERVAL === 0) {
                  console.log(
                    `Deleted ${deletedCount} ${sanitizedModelName} records${logContext} so far...`
                  );
                }
              } else {
                errors.push({
                  id: item.id,
                  error: deleteResult.error || "Failed to delete record",
                });
              }
            } catch (error) {
              const errorResult = handleError(
                "delete",
                sanitizedModelName,
                error,
                item.id
              );
              errors.push({
                id: item.id,
                error: errorResult.error,
              });
            }
          }
        }
      } else {
        return {
          success: false,
          error: `Failed to list ${sanitizedModelName} records${logContext}`,
          statusCode: 500,
        };
      }
    } while (nextToken);

    console.log(
      `Deletion complete: ${deletedCount} ${sanitizedModelName} records deleted${logContext}`
    );

    if (errors.length > 0) {
      console.warn(`${errors.length} deletion errors occurred`);
    }

    const hasDeleted = deletedCount > 0;
    const hasErrors = errors.length > 0;

    return {
      success: hasDeleted || !hasErrors,
      data: {
        deletedCount,
        errors,
      },
      statusCode: hasDeleted ? 200 : hasErrors ? 500 : 200,
      ...(hasErrors && {
        error: `${errors.length} records failed to delete out of ${deletedCount + errors.length} total records`,
      }),
    };
  } catch (error) {
    const errorResult = handleError(
      "delete",
      `${sanitizedModelName} records${logContext}`,
      error
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Generic function to delete ALL records of a specific model type from the database
 * WARNING: This operation is irreversible and will delete ALL records of the specified model
 *
 * @param {string} modelName - The name of the model to delete all records from (e.g., "Education", "PastJob")
 * @param {boolean} confirmDelete - Safety flag that must be set to true to proceed
 * @param {number} batchSize - Number of records to process in each batch (default: 50)
 * @returns {Promise<ApiResponse<{deletedCount: number, errors: {id: string, error: string}[]}>>} - API response with deletion summary
 */
export async function deleteAllModelRecords(
  modelName: string,
  confirmDelete: boolean = false,
  batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE
): Promise<
  ApiResponse<{ deletedCount: number; errors: { id: string; error: string }[] }>
> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Safety check - require explicit confirmation
  if (!confirmDelete) {
    return {
      success: false,
      error: `Safety check failed: You must explicitly set confirmDelete to true to delete all ${modelName} records. This operation cannot be undone.`,
      statusCode: 400,
    };
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate batch size (no sanitization needed for numbers)
  const batchSizeValidation = validateOrError(validateBatchSize(batchSize));
  if (batchSizeValidation) return batchSizeValidation;

  return bulkDeleteRecords(sanitizedModelName, null, batchSize);
}

/**
 * Safer alternative that deletes all records for a specific user
 * This is often more practical than deleting ALL records system-wide
 *
 * @param {string} modelName - The name of the model to delete records from
 * @param {string} userId - The user ID to filter records by
 * @param {boolean} confirmDelete - Safety flag that must be set to true to proceed
 * @param {number} batchSize - Number of records to process in each batch
 * @returns {Promise<ApiResponse<{deletedCount: number, errors: {id: string, error: string}[]}>>} - API response with deletion summary
 */
export async function deleteAllUserModelRecords(
  modelName: string,
  userId: string,
  confirmDelete: boolean = false,
  batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE
): Promise<
  ApiResponse<{ deletedCount: number; errors: { id: string; error: string }[] }>
> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Safety check - require explicit confirmation
  if (!confirmDelete) {
    return {
      success: false,
      error: `Safety check failed: You must explicitly set confirmDelete to true to delete all ${modelName} records for user ${userId}.`,
      statusCode: 400,
    };
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize userId
  const userIdResult = sanitizeOrError(validateAndSanitizeId(userId, "userId"));
  if (!userIdResult.success) return userIdResult.error;
  const sanitizedUserId = userIdResult.sanitized;

  // Validate batch size (no sanitization needed for numbers)
  const batchSizeValidation = validateOrError(validateBatchSize(batchSize));
  if (batchSizeValidation) return batchSizeValidation;

  const filter = { userId: { eq: sanitizedUserId } };
  const logContext = ` for user ${sanitizedUserId}`;

  return bulkDeleteRecords(sanitizedModelName, filter, batchSize, logContext);
}

/**
 * Advanced function to delete records based on custom filter criteria
 * Provides maximum flexibility for complex deletion scenarios
 *
 * @param {string} modelName - The name of the model to delete records from
 * @param {object} filter - GraphQL filter object to determine which records to delete
 * @param {boolean} confirmDelete - Safety flag that must be set to true to proceed
 * @param {number} batchSize - Number of records to process in each batch
 * @param {string} description - Description of what's being deleted (for logging)
 * @returns {Promise<ApiResponse<{deletedCount: number, errors: {id: string, error: string}[]}>>} - API response with deletion summary
 */
export async function deleteFilteredModelRecords(
  modelName: string,
  filter: any,
  confirmDelete: boolean = false,
  batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE,
  description: string = "filtered records"
): Promise<
  ApiResponse<{ deletedCount: number; errors: { id: string; error: string }[] }>
> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Safety check - require explicit confirmation
  if (!confirmDelete) {
    return {
      success: false,
      error: `Safety check failed: You must explicitly set confirmDelete to true to delete ${description}.`,
      statusCode: 400,
    };
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize filter object
  const filterResult = sanitizeOrError(
    validateAndSanitizeObject(filter, "filter", {
      preserveFields: [
        "eq",
        "ne",
        "gt",
        "lt",
        "ge",
        "le",
        "contains",
        "notContains",
        "between",
        "beginsWith",
      ],
      escapeHtml: false,
      maxLength: 1000,
    })
  );
  if (!filterResult.success) return filterResult.error;
  const sanitizedFilter = filterResult.sanitized;

  // Validate batch size (no sanitization needed for numbers)
  const batchSizeValidation = validateOrError(validateBatchSize(batchSize));
  if (batchSizeValidation) return batchSizeValidation;

  const logContext = ` (${description})`;

  return bulkDeleteRecords(
    sanitizedModelName,
    sanitizedFilter,
    batchSize,
    logContext
  );
}
