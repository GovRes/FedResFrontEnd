import { generateClient } from "aws-amplify/api";
import { getModelFields, validateModelName } from "./modelUtils";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Generic function to create any model type in the database
 *
 * @param {string} modelName - The name of the model to create (e.g., "Education", "PastJob")
 * @param {Object} input - The input object with the model's fields
 * @param {string} userId - Optional user ID to add to the record
 * @returns {Promise<ApiResponse>} - The API response with created record data
 */
export async function createModelRecord(
  modelName: string,
  input: object,
  userId?: string
): Promise<ApiResponse> {
  const client = generateClient();

  // Extract fields we don't want to include in the create operation
  const { createdAt, id, qualifications, updatedAt, ...filteredUpdateData } =
    input as any;

  // Add userId to the input object if provided
  if (userId) {
    filteredUpdateData.userId = userId;
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

  try {
    // Create the GraphQL mutation query
    const mutation = `
      mutation Create${modelName}($input: Create${modelName}Input!) {
        create${modelName}(input: $input) {
          id
          createdAt
          updatedAt
          ${getModelFields(modelName)}
        }
      }
    `;

    // Execute the GraphQL mutation
    const createResult = await client.graphql({
      query: mutation,
      variables: {
        input: filteredUpdateData,
      },
      authMode: "userPool",
    });

    // Verify successful creation
    if ("data" in createResult && createResult.data?.[`create${modelName}`]) {
      return {
        success: true,
        data: createResult.data[`create${modelName}`],
        statusCode: 201,
      };
    } else {
      return {
        success: false,
        error: `Failed to create ${modelName} record`,
        statusCode: 500,
      };
    }
  } catch (error) {
    console.error(`Error creating ${modelName} record:`, error);
    return {
      success: false,
      error: `Failed to create ${modelName} record`,
      statusCode: 500,
    };
  }
}

/**
 * Helper function for batch creation of multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to create (e.g., "Education", "PastJob")
 * @param {Object[]} inputs - Array of input objects with model fields
 * @param {string} userId - Optional user ID to add to all records
 * @returns {Promise<ApiResponse<{created: any[], failed: {input: any, error: string}[]}>>} - API response with created records and any failures
 */
export async function batchCreateModelRecords(
  modelName: string,
  inputs: object[],
  userId?: string
): Promise<
  ApiResponse<{ created: any[]; failed: { input: any; error: string }[] }>
> {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    return {
      success: false,
      error: "Invalid input: inputs must be a non-empty array",
      statusCode: 400,
    };
  }

  const created: any[] = [];
  const failed: { input: any; error: string }[] = [];

  // Process each input sequentially to avoid overwhelming the API
  for (const input of inputs) {
    try {
      const result = await createModelRecord(modelName, input, userId);
      if (result.success && result.data) {
        created.push(result.data);
      } else {
        failed.push({
          input,
          error: result.error || `Failed to create ${modelName} record`,
        });
      }
    } catch (error) {
      console.error(`Failed to create ${modelName} record:`, error);
      failed.push({
        input,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Determine overall success status
  const hasCreated = created.length > 0;
  const hasFailed = failed.length > 0;
  const allFailed = failed.length === inputs.length;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to create all ${inputs.length} ${modelName} records`,
      statusCode: 500,
    };
  }

  return {
    success: hasCreated,
    data: { created, failed },
    statusCode: hasCreated ? 201 : 500,
    ...(hasFailed && {
      error: `${failed.length} of ${inputs.length} ${modelName} records failed to create`,
    }),
  };
}

/**
 * Example usage:
 *
 * // Create a single education record
 * const educationResult = await createModelRecord("Education", {
 *   school: "University of Example",
 *   degree: "Bachelor of Science",
 *   major: "Computer Science",
 *   date: "2022-05-15",
 * }, "user123");
 *
 * if (educationResult.success && educationResult.data) {
 *   console.log("Created education record:", educationResult.data);
 * } else {
 *   console.error(`Error ${educationResult.statusCode}:`, educationResult.error);
 * }
 *
 * // Create multiple PastJob records
 * const batchJobsResult = await batchCreateModelRecords("PastJob", [
 *   {
 *     title: "Software Engineer",
 *     organization: "Tech Co",
 *     startDate: "2020-01-15",
 *     endDate: "2022-03-30",
 *   },
 *   {
 *     title: "Web Developer",
 *     organization: "Agency Inc",
 *     startDate: "2018-06-01",
 *     endDate: "2019-12-31",
 *   }
 * ], "user123");
 *
 * if (batchJobsResult.success && batchJobsResult.data) {
 *   const { created, failed } = batchJobsResult.data;
 *   console.log(`Successfully created ${created.length} job records:`, created);
 *
 *   if (failed.length > 0) {
 *     console.warn(`${failed.length} job records failed to create:`, failed);
 *   }
 * } else {
 *   console.error(`Error ${batchJobsResult.statusCode}:`, batchJobsResult.error);
 * }
 */
