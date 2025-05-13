import { generateClient } from "aws-amplify/api";
import { getModelFields, validateModelName } from "./modelUtils";

/**
 * Generic function to fetch any model type from the database
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "PastJob")
 * @param {string} id - The ID of the record to fetch
 * @returns {Promise<Object>} - The fetched record data
 * @throws {Error} - If fetching fails or model type is unsupported
 */
export async function fetchModelRecord(modelName: string, id: string) {
  const client = generateClient();

  // Validate the model name
  validateModelName(modelName);

  try {
    // Create the GraphQL query
    const query = `
      query Get${modelName}($id: ID!) {
        get${modelName}(id: $id) {
          id
          createdAt
          updatedAt
          ${getModelFields(modelName)}
        }
      }
    `;

    // Execute the GraphQL query
    const fetchResult = await client.graphql({
      query: query,
      variables: {
        id,
      },
      authMode: "userPool",
    });

    // Verify successful fetch
    if ("data" in fetchResult && fetchResult.data?.[`get${modelName}`]) {
      return fetchResult.data[`get${modelName}`];
    } else {
      throw new Error(`Failed to fetch ${modelName} record with ID: ${id}`);
    }
  } catch (error) {
    console.error(`Error fetching ${modelName} record:`, error);
    throw error;
  }
}

/**
 * Function to fetch multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "PastJob")
 * @param {Object} filter - Optional filter object for the query
 * @param {number} limit - Optional limit for the number of records to fetch
 * @param {string} nextToken - Optional pagination token
 * @returns {Promise<{items: Object[], nextToken?: string}>} - Array of fetched records and next pagination token if available
 */
export async function listModelRecords(
  modelName: string,
  filter?: object,
  limit?: number,
  nextToken?: string
) {
  const client = generateClient();

  // Validate the model name
  validateModelName(modelName);

  try {
    // Create the GraphQL query
    const query = `
      query List${modelName}s($filter: Model${modelName}FilterInput, $limit: Int, $nextToken: String) {
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
      throw new Error(`Failed to list ${modelName} records`);
    }
  } catch (error) {
    console.error(`Error listing ${modelName} records:`, error);
    throw error;
  }
}

/**
 * Example usage:
 *
 * // Fetch a single education record
 * const education = await fetchModelRecord("Education", "abc123");
 *
 * // List all PastJob records for a specific user
 * const { items: userJobs, nextToken } = await listModelRecords("PastJob", { userId: { eq: "user123" } }, 10);
 *
 * // Fetch the next page of results
 * const { items: moreJobs } = await listModelRecords("PastJob", { userId: { eq: "user123" } }, 10, nextToken);
 */
