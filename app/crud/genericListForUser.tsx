import { generateClient } from "aws-amplify/api";
import { getModelFields, validateModelName, modelFields } from "./modelUtils";

/**
 * Generic function to fetch all records of a model type for a specific user
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "PastJob")
 * @param {string} userId - The user ID to filter by
 * @param {number} limit - Optional limit for the number of records to fetch
 * @param {string} nextToken - Optional pagination token
 * @returns {Promise<{items: Object[], nextToken?: string}>} - Array of fetched records and next pagination token if available
 * @throws {Error} - If fetching fails, model type is unsupported, or the model doesn't have a userId field
 */
export async function listUserModelRecords(
  modelName: string,
  userId: string,
  limit?: number,
  nextToken?: string
) {
  const client = generateClient();

  // Validate the model name
  validateModelName(modelName);

  // Check if the model has a userId field
  if (!modelFields[modelName].includes("userId")) {
    throw new Error(`Model ${modelName} does not have a userId field`);
  }

  try {
    // Create the GraphQL query
    const query = `
      query List${modelName}sByUserId($filter: Model${modelName}FilterInput, $limit: Int, $nextToken: String) {
        list${modelName}s(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            createdAt
            updatedAt
            ${getModelFields(modelName)}
          }
          nextToken
        }
      }
    `;

    // Create a filter to get only records for this user
    const filter = {
      userId: { eq: userId },
    };

    // Execute the GraphQL query
    const listResult = await client.graphql({
      query: query,
      variables: {
        filter,
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    // Verify successful fetch
    if ("data" in listResult && listResult.data?.[`list${modelName}s`]) {
      return {
        items: listResult.data[`list${modelName}s`].items,
        nextToken: listResult.data[`list${modelName}s`].nextToken,
      };
    } else {
      throw new Error(`Failed to list ${modelName} records for user ${userId}`);
    }
  } catch (error) {
    console.error(`Error listing ${modelName} records for user:`, error);
    throw error;
  }
}

/**
 * Generic function to fetch all user records across multiple models
 *
 * @param {string[]} modelNames - Array of model names to fetch (e.g., ["Education", "PastJob"])
 * @param {string} userId - The user ID to filter by
 * @param {number} limit - Optional limit for each model type (applied per model)
 * @returns {Promise<Record<string, Object[]>>} - Object with model names as keys and arrays of records as values
 */
export async function listAllUserRecords(
  modelNames: string[],
  userId: string,
  limit?: number
) {
  const results: Record<string, any[]> = {};
  const errors: string[] = [];

  // Process models in parallel for better performance
  const fetchPromises = modelNames.map(async (modelName) => {
    try {
      // Check if this model has a userId field before attempting to fetch
      if (modelFields[modelName]?.includes("userId")) {
        const { items } = await listUserModelRecords(modelName, userId, limit);
        results[modelName] = items;
      } else {
        errors.push(`Model ${modelName} does not have a userId field`);
      }
    } catch (error) {
      // Log the error but continue with other models
      console.error(`Error fetching ${modelName} records:`, error);
      errors.push(
        `Failed to fetch ${modelName}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  });

  // Wait for all promises to resolve
  await Promise.all(fetchPromises);

  // If there were errors, attach them to the result
  if (errors.length > 0) {
    results._errors = errors;
  }

  return results;
}

/**
 * Example usage:
 *
 * // List all education records for a specific user
 * const { items: userEducation, nextToken } = await listUserModelRecords("Education", "user123", 10);
 *
 * // Get the next page of results
 * const { items: moreEducation } = await listUserModelRecords("Education", "user123", 10, nextToken);
 *
 * // Fetch multiple record types for a user
 * const userRecords = await listAllUserRecords(
 *   ["Education", "PastJob", "Award", "Volunteer"],
 *   "user123",
 *   20
 * );
 *
 * // Access specific record types
 * const userEducation = userRecords.Education;
 * const userJobs = userRecords.PastJob;
 */
