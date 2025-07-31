import { generateClient } from "aws-amplify/api";
import { validateModelName } from "./modelUtils";

/**
 * Generic function to delete ALL records of a specific model type from the database
 * WARNING: This operation is irreversible and will delete ALL records of the specified model
 *
 * @param {string} modelName - The name of the model to delete all records from (e.g., "Education", "PastJob")
 * @param {number} batchSize - Number of records to process in each batch (default: 50)
 * @param {boolean} confirmDelete - Safety flag that must be set to true to proceed
 * @returns {Promise<{deletedCount: number, errors: any[]}>} - Summary of deletion results
 * @throws {Error} - If deletion fails, model type is unsupported, or safety confirmation not provided
 */
export async function deleteAllModelRecords(
  modelName: string,
  confirmDelete: boolean = false,
  batchSize: number = 50
) {
  const client = generateClient();

  // Safety check - require explicit confirmation
  if (!confirmDelete) {
    throw new Error(
      `Safety check failed: You must explicitly set confirmDelete to true to delete all ${modelName} records. This operation cannot be undone.`
    );
  }

  // Validate the model name
  validateModelName(modelName);

  let deletedCount = 0;
  let errors: any[] = [];
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
                error: error,
              });
            }
          }
        }
      } else {
        throw new Error(`Failed to list ${modelName} records`);
      }
    } while (nextToken);

    console.log(
      `Deletion complete: ${deletedCount} ${modelName} records deleted`
    );

    if (errors.length > 0) {
      console.warn(`${errors.length} deletion errors occurred`);
    }

    return {
      deletedCount,
      errors,
    };
  } catch (error) {
    console.error(`Error during bulk deletion of ${modelName} records:`, error);
    throw error;
  }
}

/**
 * Helper function to delete a single model record (reused from the original file)
 */
async function deleteModelRecord(modelName: string, id: string) {
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
 * @returns {Promise<{deletedCount: number, errors: any[]}>} - Summary of deletion results
 */
export async function deleteAllUserModelRecords(
  modelName: string,
  userId: string,
  confirmDelete: boolean = false,
  batchSize: number = 50
) {
  const client = generateClient();

  if (!confirmDelete) {
    throw new Error(
      `Safety check failed: You must explicitly set confirmDelete to true to delete all ${modelName} records for user ${userId}.`
    );
  }

  validateModelName(modelName);

  let deletedCount = 0;
  let errors: any[] = [];
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
            } catch (error) {
              errors.push({
                id: item.id,
                error: error,
              });
            }
          }
        }
      } else {
        throw new Error(
          `Failed to list ${modelName} records for user ${userId}`
        );
      }
    } while (nextToken);

    console.log(
      `Deletion complete: ${deletedCount} ${modelName} records deleted for user ${userId}`
    );

    return {
      deletedCount,
      errors,
    };
  } catch (error) {
    console.error(
      `Error during bulk deletion of ${modelName} records for user ${userId}:`,
      error
    );
    throw error;
  }
}

/**
 * Example usage:
 *
 * // Delete ALL Education records in the system (use with extreme caution!)
 * const result = await deleteAllModelRecords("Education", true);
 * console.log(`Deleted ${result.deletedCount} education records`);
 *
 * // Delete all PastJob records for a specific user (safer)
 * const userResult = await deleteAllUserModelRecords("PastJob", "user123", true);
 * console.log(`Deleted ${userResult.deletedCount} past job records for user`);
 *
 * // Safety check - this will throw an error
 * try {
 *   await deleteAllModelRecords("Education", false); // Will throw error
 * } catch (error) {
 *   console.log("Safety check prevented accidental deletion");
 * }
 */
