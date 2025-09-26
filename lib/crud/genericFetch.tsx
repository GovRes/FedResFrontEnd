import { generateClient } from "aws-amplify/api";
import { getModelFields, validateModelName } from "./modelUtils";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Generic function to fetch any model type from the database
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "PastJob")
 * @param {string} id - The ID of the record to fetch
 * @returns {Promise<ApiResponse>} - The API response with status code and data/error
 */
export async function fetchModelRecord(
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
      return {
        success: true,
        data: fetchResult.data[`get${modelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${modelName} record with ID: ${id} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error(`Error fetching ${modelName} record:`, error);
    return {
      success: false,
      error: `Failed to fetch ${modelName} record`,
      statusCode: 500,
    };
  }
}

/**
 * Function to fetch multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "PastJob")
 * @param {Object} filter - Optional filter object for the query
 * @param {number} limit - Optional limit for the number of records to fetch
 * @param {string} nextToken - Optional pagination token
 * @returns {Promise<ApiResponse<{items: Object[], nextToken?: string}>>} - API response with array of fetched records and next pagination token if available
 */
export async function listModelRecords(
  modelName: string,
  filter?: object,
  limit?: number,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
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
        success: true,
        data: {
          items: listResult.data[`list${modelName}s`].items,
          nextToken: listResult.data[`list${modelName}s`].nextToken,
        },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `Failed to list ${modelName} records`,
        statusCode: 500,
      };
    }
  } catch (error) {
    console.error(`Error listing ${modelName} records:`, error);
    return {
      success: false,
      error: `Failed to list ${modelName} records`,
      statusCode: 500,
    };
  }
}

/**
 * Example usage:
 *
 * // Fetch a single education record
 * const educationResult = await fetchModelRecord("Education", "abc123");
 * if (educationResult.success) {
 *   console.log("Education record:", educationResult.data);
 * } else {
 *   console.error(`Error ${educationResult.statusCode}:`, educationResult.error);
 * }
 *
 * // List all PastJob records for a specific user
 * const jobsResult = await listModelRecords("PastJob", { userId: { eq: "user123" } }, 10);
 * if (jobsResult.success && jobsResult.data) {
 *   const { items: userJobs, nextToken } = jobsResult.data;
 *   console.log("Jobs:", userJobs);
 *
 *   // Fetch the next page of results if nextToken exists
 *   if (nextToken) {
 *     const moreJobsResult = await listModelRecords("PastJob", { userId: { eq: "user123" } }, 10, nextToken);
 *     if (moreJobsResult.success && moreJobsResult.data) {
 *       console.log("More jobs:", moreJobsResult.data.items);
 *     }
 *   }
 * } else {
 *   console.error(`Error ${jobsResult.statusCode}:`, jobsResult.error);
 * }
 */
