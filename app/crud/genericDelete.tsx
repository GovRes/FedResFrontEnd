import { generateClient } from "aws-amplify/api";
import { validateModelName } from "./modelUtils";

/**
 * Generic function to delete any model type from the database
 *
 * @param {string} modelName - The name of the model to delete (e.g., "Education", "PastJob")
 * @param {string} id - The ID of the record to delete
 * @returns {Promise<Object>} - The deleted record data
 * @throws {Error} - If deletion fails or model type is unsupported
 */
export async function deleteModelRecord(modelName: string, id: string) {
  const client = generateClient();

  // Validate the model name
  validateModelName(modelName);

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
      return deleteResult.data[`delete${modelName}`];
    } else {
      throw new Error(`Failed to delete ${modelName} record with ID: ${id}`);
    }
  } catch (error) {
    console.error(`Error deleting ${modelName} record:`, error);
    throw error;
  }
}

/**
 * Helper function for batch deletion of multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to delete (e.g., "Education", "PastJob")
 * @param {string[]} ids - Array of IDs to delete
 * @returns {Promise<Object[]>} - Array of deleted record data
 */
export async function batchDeleteModelRecords(
  modelName: string,
  ids: string[]
) {
  const results = [];

  for (const id of ids) {
    try {
      const result = await deleteModelRecord(modelName, id);
      results.push(result);
    } catch (error) {
      console.error(`Failed to delete ${modelName} with ID ${id}:`, error);
      // Continue with other deletions even if one fails
    }
  }

  return results;
}

/**
 * Example usage:
 *
 * // Delete a single education record
 * const deletedEducation = await deleteModelRecord("Education", "abc123");
 *
 * // Delete multiple PastJob records
 * const deletedJobs = await batchDeleteModelRecords("PastJob", ["job1", "job2", "job3"]);
 */
