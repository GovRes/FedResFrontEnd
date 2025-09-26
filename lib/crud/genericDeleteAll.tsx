import { generateClient } from "aws-amplify/api";
import { validateModelName } from "./modelUtils";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
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
  const client = generateClient();

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

  let deletedCount = 0;
  let errors: { id: string; error: string }[] = [];
  let nextToken: string | null = null;

  try {
    console.log(`Starting deletion of all ${modelName} records...`);

    do {
      // First, list all records of this model type
      const listQuery = `
        query List${modelName}s($limit: Int, $nextToken: String) {
          list${modelName}s(limit: $limit, nextToken: $nextToken) {
            items {
              id
            }
            nextToken
          }
        }
      `;

      const listResult: any = await client.graphql({
        query: listQuery,
        variables: {
          limit: batchSize,
          nextToken: nextToken,
        },
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
              await deleteModelRecord(modelName, item.id);
              deletedCount++;

              // Log progress for large operations
              if (deletedCount % 25 === 0) {
                console.log(
                  `Deleted ${deletedCount} ${modelName} records so far...`
                );
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
          error: `Failed to list ${modelName} records`,
          statusCode: 500,
        };
      }
    } while (nextToken);

    console.log(
      `Deletion complete: ${deletedCount} ${modelName} records deleted`
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
    console.error(`Error during bulk deletion of ${modelName} records:`, error);
    return {
      success: false,
      error: `Failed to delete ${modelName} records: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Helper function to delete a single model record
 */
async function deleteModelRecord(modelName: string, id: string): Promise<any> {
  const client = generateClient();

  const mutation = `
    mutation Delete${modelName}($input: Delete${modelName}Input!) {
      delete${modelName}(input: $input) {
        id
        createdAt
        updatedAt
      }
    }
  `;

  const deleteResult: any = await client.graphql({
    query: mutation,
    variables: {
      input: { id },
    },
    authMode: "userPool",
  });

  if ("data" in deleteResult && deleteResult.data) {
    const deleteData = (deleteResult.data as any)[`delete${modelName}`];
    if (deleteData) {
      return deleteData;
    }
  }

  throw new Error(`Failed to delete ${modelName} record with ID: ${id}`);
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
  const client = generateClient();

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

  let deletedCount = 0;
  let errors: { id: string; error: string }[] = [];
  let nextToken: string | null = null;

  try {
    console.log(
      `Starting deletion of all ${modelName} records for user ${userId}...`
    );

    do {
      // List records filtered by userId
      const listQuery = `
        query List${modelName}s($filter: Model${modelName}FilterInput, $limit: Int, $nextToken: String) {
          list${modelName}s(filter: $filter, limit: $limit, nextToken: $nextToken) {
            items {
              id
            }
            nextToken
          }
        }
      `;

      const listResult: any = await client.graphql({
        query: listQuery,
        variables: {
          filter: {
            userId: { eq: userId },
          },
          limit: batchSize,
          nextToken: nextToken,
        },
        authMode: "userPool",
      });

      if ("data" in listResult && listResult.data) {
        const listData = (listResult.data as any)[`list${modelName}s`];
        if (listData) {
          const items = listData.items;
          nextToken = listData.nextToken;

          if (items.length === 0) {
            break;
          }

          for (const item of items) {
            try {
              await deleteModelRecord(modelName, item.id);
              deletedCount++;

              // Log progress for large operations
              if (deletedCount % 25 === 0) {
                console.log(
                  `Deleted ${deletedCount} ${modelName} records for user ${userId} so far...`
                );
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
          error: `Failed to list ${modelName} records for user ${userId}`,
          statusCode: 500,
        };
      }
    } while (nextToken);

    console.log(
      `Deletion complete: ${deletedCount} ${modelName} records deleted for user ${userId}`
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
        error: `${errors.length} records failed to delete out of ${deletedCount + errors.length} total records for user ${userId}`,
      }),
    };
  } catch (error) {
    console.error(
      `Error during bulk deletion of ${modelName} records for user ${userId}:`,
      error
    );
    return {
      success: false,
      error: `Failed to delete ${modelName} records for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Example usage:
 *
 * // Delete ALL Education records in the system (use with extreme caution!)
 * const result = await deleteAllModelRecords("Education", true);
 * if (result.success && result.data) {
 *   console.log(`Deleted ${result.data.deletedCount} education records`);
 *   if (result.data.errors.length > 0) {
 *     console.warn("Some deletions failed:", result.data.errors);
 *   }
 * } else {
 *   console.error(`Error ${result.statusCode}:`, result.error);
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
 * // Safety check - this will return an error response
 * const safetyResult = await deleteAllModelRecords("Education", false); // Will return error
 * if (!safetyResult.success) {
 *   console.log("Safety check prevented accidental deletion:", safetyResult.error);
 * }
 */
