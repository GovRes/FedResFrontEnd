import { generateClient } from "aws-amplify/api";
import { getModelFields, validateModelName } from "./modelUtils";

/**
 * Generic function to create any model type in the database
 *
 * @param {string} modelName - The name of the model to create (e.g., "Education", "PastJob")
 * @param {Object} input - The input object with the model's fields
 * @returns {Promise<Object>} - The created record data
 * @throws {Error} - If creation fails or model type is unsupported
 */
export async function createModelRecord(
  modelName: string,
  input: object,
  userId?: string
) {
  const client = generateClient();
  // Extract fields we don't want to include in the create operation
  const { createdAt, id, qualifications, updatedAt, ...filteredUpdateData } =
    input as any;

  // Add userId to the input object if provided
  if (userId) {
    filteredUpdateData.userId = userId;
  }
  // Validate the model name
  validateModelName(modelName);

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
      return createResult.data[`create${modelName}`];
    } else {
      throw new Error(`Failed to create ${modelName} record`);
    }
  } catch (error) {
    console.error(`Error creating ${modelName} record:`, error);
    throw error;
  }
}

/**
 * Helper function for batch creation of multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to create (e.g., "Education", "PastJob")
 * @param {Object[]} inputs - Array of input objects with model fields
 * @returns {Promise<Object[]>} - Array of created record data
 */
export async function batchCreateModelRecords(
  modelName: string,
  inputs: object[],
  userId?: string
) {
  const results = [];
  console.log("batch create", inputs, modelName);
  for (const input of inputs) {
    try {
      const result = await createModelRecord(modelName, input, userId);
      results.push(result);
    } catch (error) {
      console.error(`Failed to create ${modelName} record:`, error);
      // Continue with other creations even if one fails
    }
  }

  return results;
}

/**
 * Example usage:
 *
 * // Create a single education record
 * const newEducation = await createModelRecord("Education", {
 *   school: "University of Example",
 *   degree: "Bachelor of Science",
 *   major: "Computer Science",
 *   date: "2022-05-15",
 *   userId: "user123"
 * });
 *
 * // Create multiple PastJob records
 * const newJobs = await batchCreateModelRecords("PastJob", [
 *   {
 *     title: "Software Engineer",
 *     organization: "Tech Co",
 *     startDate: "2020-01-15",
 *     endDate: "2022-03-30",
 *     userId: "user123"
 *   },
 *   {
 *     title: "Web Developer",
 *     organization: "Agency Inc",
 *     startDate: "2018-06-01",
 *     endDate: "2019-12-31",
 *     userId: "user123"
 *   }
 * ]);
 */
