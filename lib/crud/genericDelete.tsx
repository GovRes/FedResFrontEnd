import { generateClient } from "aws-amplify/api";
import { validateModelName } from "./modelUtils";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Generic function to delete any model type from the database
 *
 * @param {string} modelName - The name of the model to delete (e.g., "Education", "PastJob")
 * @param {string} id - The ID of the record to delete
 * @returns {Promise<ApiResponse>} - The API response with deleted record data
 */
export async function deleteModelRecord(
  modelName: string,
  id: string
): Promise<ApiResponse> {
  const client = generateClient();

  // Validate the model name
  try {
    validateModelName(modelName);
  } catch (error) {
    return {
      success: false,
      error: `Invalid model name: ${modelName}`,
      statusCode: 400,
    };
  }

  // Validate the ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    return {
      success: false,
      error: "Invalid ID: ID must be a non-empty string",
      statusCode: 400,
    };
  }

  try {
    // Create the GraphQL mutation query
    const mutation = `
      mutation Delete${modelName}($input: Delete${modelName}Input!) {
        delete${modelName}(input: $input) {
          id
          createdAt
          updatedAt
        }
      }
    `;

    // Execute the GraphQL mutation
    const deleteResult = await client.graphql({
      query: mutation,
      variables: {
        input: { id },
      },
      authMode: "userPool",
    });

    // Verify successful deletion
    if ("data" in deleteResult && deleteResult.data?.[`delete${modelName}`]) {
      return {
        success: true,
        data: deleteResult.data[`delete${modelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${modelName} record with ID: ${id} not found or could not be deleted`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error(`Error deleting ${modelName} record:`, error);

    // Check if it's a "not found" error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.toLowerCase().includes("not found") ||
      errorMessage.toLowerCase().includes("does not exist")
    ) {
      return {
        success: false,
        error: `${modelName} record with ID: ${id} not found`,
        statusCode: 404,
      };
    }

    return {
      success: false,
      error: `Failed to delete ${modelName} record with ID: ${id}`,
      statusCode: 500,
    };
  }
}

/**
 * Helper function for batch deletion of multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to delete (e.g., "Education", "PastJob")
 * @param {string[]} ids - Array of IDs to delete
 * @returns {Promise<ApiResponse<{deleted: any[], failed: {id: string, error: string}[]}>>} - API response with deleted records and any failures
 */
export async function batchDeleteModelRecords(
  modelName: string,
  ids: string[]
): Promise<
  ApiResponse<{ deleted: any[]; failed: { id: string; error: string }[] }>
> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {
      success: false,
      error: "Invalid input: ids must be a non-empty array",
      statusCode: 400,
    };
  }

  // Validate all IDs first
  const invalidIds = ids.filter(
    (id) => !id || typeof id !== "string" || id.trim() === ""
  );
  if (invalidIds.length > 0) {
    return {
      success: false,
      error: `Invalid IDs found: ${invalidIds.length} empty or invalid IDs`,
      statusCode: 400,
    };
  }

  const deleted: any[] = [];
  const failed: { id: string; error: string }[] = [];

  // Process each ID sequentially to avoid overwhelming the API
  for (const id of ids) {
    try {
      const result = await deleteModelRecord(modelName, id);
      if (result.success && result.data) {
        deleted.push(result.data);
      } else {
        failed.push({
          id,
          error: result.error || `Failed to delete ${modelName} record`,
        });
      }
    } catch (error) {
      console.error(`Failed to delete ${modelName} with ID ${id}:`, error);
      failed.push({
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Determine overall success status
  const hasDeleted = deleted.length > 0;
  const hasFailed = failed.length > 0;
  const allFailed = failed.length === ids.length;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to delete all ${ids.length} ${modelName} records`,
      statusCode: 500,
    };
  }

  return {
    success: hasDeleted,
    data: { deleted, failed },
    statusCode: hasDeleted ? 200 : 500,
    ...(hasFailed && {
      error: `${failed.length} of ${ids.length} ${modelName} records failed to delete`,
    }),
  };
}

/**
 * Core function for bulk deletion with optional filtering
 * This is the unified implementation used by both deleteAllModelRecords and deleteAllUserModelRecords
 */
async function bulkDeleteRecords(
  modelName: string,
  filter: any = null,
  batchSize: number = 50,
  logContext: string = ""
): Promise<
  ApiResponse<{ deletedCount: number; errors: { id: string; error: string }[] }>
> {
  const client = generateClient();

  let deletedCount = 0;
  let errors: { id: string; error: string }[] = [];
  let nextToken: string | null = null;

  try {
    console.log(`Starting deletion of ${modelName} records${logContext}...`);

    do {
      // Build the appropriate query based on whether we have a filter
      const listQuery = filter
        ? `
          query List${modelName}s($filter: Model${modelName}FilterInput, $limit: Int, $nextToken: String) {
            list${modelName}s(filter: $filter, limit: $limit, nextToken: $nextToken) {
              items {
                id
              }
              nextToken
            }
          }
        `
        : `
          query List${modelName}s($limit: Int, $nextToken: String) {
            list${modelName}s(limit: $limit, nextToken: $nextToken) {
              items {
                id
              }
              nextToken
            }
          }
        `;

      const variables = filter
        ? { filter, limit: batchSize, nextToken }
        : { limit: batchSize, nextToken };

      const listResult: any = await client.graphql({
        query: listQuery,
        variables,
        authMode: "userPool",
      });

      if ("data" in listResult && listResult.data) {
        const listData = (listResult.data as any)[`list${modelName}s`];
        if (listData) {
          const items = listData.items;
          nextToken = listData.nextToken;

          if (items.length === 0) {
            break; // No more records to delete
          }

          // Delete each record in the current batch
          for (const item of items) {
            try {
              const deleteResult = await deleteModelRecord(modelName, item.id);
              if (deleteResult.success) {
                deletedCount++;

                // Log progress for large operations
                if (deletedCount % 25 === 0) {
                  console.log(
                    `Deleted ${deletedCount} ${modelName} records${logContext} so far...`
                  );
                }
              } else {
                errors.push({
                  id: item.id,
                  error: deleteResult.error || "Failed to delete record",
                });
              }
            } catch (error) {
              console.error(
                `Failed to delete ${modelName} with ID ${item.id}:`,
                error
              );
              errors.push({
                id: item.id,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
      } else {
        return {
          success: false,
          error: `Failed to list ${modelName} records${logContext}`,
          statusCode: 500,
        };
      }
    } while (nextToken);

    console.log(
      `Deletion complete: ${deletedCount} ${modelName} records deleted${logContext}`
    );

    if (errors.length > 0) {
      console.warn(`${errors.length} deletion errors occurred`);
    }

    const hasDeleted = deletedCount > 0;
    const hasErrors = errors.length > 0;

    return {
      success: hasDeleted || !hasErrors, // Success if we deleted something OR if there were no errors (even if nothing to delete)
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
    console.error(
      `Error during bulk deletion of ${modelName} records${logContext}:`,
      error
    );
    return {
      success: false,
      error: `Failed to delete ${modelName} records${logContext}: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
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
  batchSize: number = 50
): Promise<
  ApiResponse<{ deletedCount: number; errors: { id: string; error: string }[] }>
> {
  // Safety check - require explicit confirmation
  if (!confirmDelete) {
    return {
      success: false,
      error: `Safety check failed: You must explicitly set confirmDelete to true to delete all ${modelName} records. This operation cannot be undone.`,
      statusCode: 400,
    };
  }

  // Validate the model name
  try {
    validateModelName(modelName);
  } catch (error) {
    return {
      success: false,
      error: `Invalid model name: ${modelName}`,
      statusCode: 400,
    };
  }

  // Validate batch size
  if (batchSize <= 0 || batchSize > 1000) {
    return {
      success: false,
      error: "Batch size must be between 1 and 1000",
      statusCode: 400,
    };
  }

  return bulkDeleteRecords(modelName, null, batchSize);
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
  batchSize: number = 50
): Promise<
  ApiResponse<{ deletedCount: number; errors: { id: string; error: string }[] }>
> {
  // Safety check - require explicit confirmation
  if (!confirmDelete) {
    return {
      success: false,
      error: `Safety check failed: You must explicitly set confirmDelete to true to delete all ${modelName} records for user ${userId}.`,
      statusCode: 400,
    };
  }

  // Validate the model name
  try {
    validateModelName(modelName);
  } catch (error) {
    return {
      success: false,
      error: `Invalid model name: ${modelName}`,
      statusCode: 400,
    };
  }

  // Validate userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return {
      success: false,
      error: "Invalid userId: userId must be a non-empty string",
      statusCode: 400,
    };
  }

  // Validate batch size
  if (batchSize <= 0 || batchSize > 1000) {
    return {
      success: false,
      error: "Batch size must be between 1 and 1000",
      statusCode: 400,
    };
  }

  const filter = { userId: { eq: userId } };
  const logContext = ` for user ${userId}`;

  return bulkDeleteRecords(modelName, filter, batchSize, logContext);
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
  batchSize: number = 50,
  description: string = "filtered records"
): Promise<
  ApiResponse<{ deletedCount: number; errors: { id: string; error: string }[] }>
> {
  // Safety check - require explicit confirmation
  if (!confirmDelete) {
    return {
      success: false,
      error: `Safety check failed: You must explicitly set confirmDelete to true to delete ${description}.`,
      statusCode: 400,
    };
  }

  // Validate the model name
  try {
    validateModelName(modelName);
  } catch (error) {
    return {
      success: false,
      error: `Invalid model name: ${modelName}`,
      statusCode: 400,
    };
  }

  // Validate filter
  if (!filter || typeof filter !== "object") {
    return {
      success: false,
      error: "Invalid filter: filter must be a non-null object",
      statusCode: 400,
    };
  }

  // Validate batch size
  if (batchSize <= 0 || batchSize > 1000) {
    return {
      success: false,
      error: "Batch size must be between 1 and 1000",
      statusCode: 400,
    };
  }

  const logContext = ` (${description})`;

  return bulkDeleteRecords(modelName, filter, batchSize, logContext);
}

/**
 * Example usage:
 *
 * // Delete a single education record
 * const deleteResult = await deleteModelRecord("Education", "abc123");
 * if (deleteResult.success && deleteResult.data) {
 *   console.log("Deleted education record:", deleteResult.data);
 * } else {
 *   console.error(`Error ${deleteResult.statusCode}:`, deleteResult.error);
 * }
 *
 * // Delete multiple PastJob records
 * const batchDeleteResult = await batchDeleteModelRecords("PastJob", ["job1", "job2", "job3"]);
 * if (batchDeleteResult.success && batchDeleteResult.data) {
 *   const { deleted, failed } = batchDeleteResult.data;
 *   console.log(`Successfully deleted ${deleted.length} job records:`, deleted);
 *   if (failed.length > 0) {
 *     console.warn(`${failed.length} job records failed to delete:`, failed);
 *   }
 * } else {
 *   console.error(`Error ${batchDeleteResult.statusCode}:`, batchDeleteResult.error);
 * }
 *
 * // Delete ALL Education records in the system (use with extreme caution!)
 * const allResult = await deleteAllModelRecords("Education", true);
 * if (allResult.success && allResult.data) {
 *   console.log(`Deleted ${allResult.data.deletedCount} education records`);
 * } else {
 *   console.error(`Error ${allResult.statusCode}:`, allResult.error);
 * }
 *
 * // Delete all PastJob records for a specific user (safer)
 * const userResult = await deleteAllUserModelRecords("PastJob", "user123", true);
 * if (userResult.success && userResult.data) {
 *   console.log(`Deleted ${userResult.data.deletedCount} past job records for user`);
 * } else {
 *   console.error(`Error ${userResult.statusCode}:`, userResult.error);
 * }
 *
 * // Delete records based on custom filter (most flexible)
 * const customResult = await deleteFilteredModelRecords(
 *   "Education",
 *   {
 *     and: [
 *       { userId: { eq: "user123" } },
 *       { school: { contains: "University" } }
 *     ]
 *   },
 *   true,
 *   25,
 *   "university education records for user123"
 * );
 * if (customResult.success && customResult.data) {
 *   console.log(`Deleted ${customResult.data.deletedCount} filtered records`);
 * }
 *
 * // Safety check - this will return an error response
 * const safetyResult = await deleteAllModelRecords("Education", false);
 * if (!safetyResult.success) {
 *   console.log("Safety check prevented accidental deletion:", safetyResult.error);
 * }
 */
