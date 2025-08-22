import { generateClient } from "aws-amplify/api";
import { getModelFields, validateModelName, modelFields } from "./modelUtils";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
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

  // Check if the model has a userId field
  if (!modelFields[modelName].includes("userId")) {
    return {
      success: false,
      error: `Model ${modelName} does not have a userId field`,
      statusCode: 400,
    };
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
        error: `Failed to list ${modelName} records for user ${userId}`,
        statusCode: 500,
      };
    }
  } catch (error) {
    console.error(`Error listing ${modelName} records for user:`, error);
    return {
      success: false,
      error: `Failed to list ${modelName} records for user ${userId}`,
      statusCode: 500,
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
  const results: Record<string, any[]> = {};
  const errors: string[] = [];

  // Process models in parallel for better performance
  const fetchPromises = modelNames.map(async (modelName) => {
    try {
      // Check if this model has a userId field before attempting to fetch
      if (modelFields[modelName]?.includes("userId")) {
        const response = await listUserModelRecords(modelName, userId, limit);
        if (response.success && response.data) {
          results[modelName] = response.data.items;
        } else {
          errors.push(`Failed to fetch ${modelName}: ${response.error}`);
        }
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
 * Example usage:
 *
 * // List all education records for a specific user
 * const educationResult = await listUserModelRecords("Education", "user123", 10);
 * if (educationResult.success && educationResult.data) {
 *   const { items: userEducation, nextToken } = educationResult.data;
 *   console.log("Education records:", userEducation);
 *
 *   // Get the next page of results
 *   if (nextToken) {
 *     const moreEducationResult = await listUserModelRecords("Education", "user123", 10, nextToken);
 *     if (moreEducationResult.success && moreEducationResult.data) {
 *       console.log("More education records:", moreEducationResult.data.items);
 *     }
 *   }
 * } else {
 *   console.error(`Error ${educationResult.statusCode}:`, educationResult.error);
 * }
 *
 * // Fetch multiple record types for a user
 * const userRecordsResult = await listAllUserRecords(
 *   ["Education", "PastJob", "Award", "Volunteer"],
 *   "user123",
 *   20
 * );
 *
 * if (userRecordsResult.success && userRecordsResult.data) {
 *   // Access specific record types
 *   const userEducation = userRecordsResult.data.Education;
 *   const userJobs = userRecordsResult.data.PastJob;
 *
 *   // Check for any errors during fetching
 *   if (userRecordsResult.data._errors) {
 *     console.warn("Some models had errors:", userRecordsResult.data._errors);
 *   }
 * } else {
 *   console.error(`Error ${userRecordsResult.statusCode}:`, userRecordsResult.error);
 * }
 */
