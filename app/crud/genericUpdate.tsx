import { generateClient } from "aws-amplify/api";
import { getModelFields, validateModelName } from "./modelUtils";

/**
 * Generic function to update any model type in the database
 *
 * @param {string} modelName - The name of the model to update (e.g., "Education", "PastJob")
 * @param {string} id - The ID of the record to update
 * @param {Object} input - The input object with updated fields
 * @returns {Promise<Object>} - The updated record data
 * @throws {Error} - If update fails or model type is unsupported
 */
export async function updateModelRecord(
  modelName: string,
  id: string,
  input: object
) {
  const client = generateClient();

  // Validate the model name
  validateModelName(modelName);

  try {
    // Add the ID to the input object
    const updateInput = {
      id,
      ...input,
    };

    // Extract fields we don't want to include in the update operation
    const { createdAt, updatedAt, ...withoutTimestamps } = updateInput as any;

    // Remove relationship fields that can't be sent directly in an update mutation
    // This handles arrays of related objects (hasMany relationships)
    const fieldsToRemove = [
      "pastJobQualifications",
      "applications",
      "volunteers",
      "educations",
      "resumes",
      "specializedExperiences",
      "awards",
      "topics",
      "pastJobs",
    ];

    const filteredUpdateData = { ...withoutTimestamps };
    for (const field of fieldsToRemove) {
      if (field in filteredUpdateData) {
        delete filteredUpdateData[field];
      }
    }

    // Create the GraphQL mutation query
    const mutation = `
      mutation Update${modelName}($input: Update${modelName}Input!) {
        update${modelName}(input: $input) {
          id
          createdAt
          updatedAt
          ${getModelFields(modelName)}
        }
      }
    `;

    // Execute the GraphQL mutation
    const updateResult = await client.graphql({
      query: mutation,
      variables: {
        input: filteredUpdateData,
      },
      authMode: "userPool",
    });

    // Verify successful update
    if ("data" in updateResult && updateResult.data?.[`update${modelName}`]) {
      return updateResult.data[`update${modelName}`];
    } else {
      throw new Error(`Failed to update ${modelName} record with ID: ${id}`);
    }
  } catch (error) {
    console.error(`Error updating ${modelName} record:`, error);
    throw error;
  }
}

/**
 * Helper function for batch updating of multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to update (e.g., "Education", "PastJob")
 * @param {Array<{id: string, input: object}>} updates - Array of objects with id and input properties
 * @returns {Promise<Object[]>} - Array of updated record data
 */
export async function batchUpdateModelRecords(
  modelName: string,
  updates: Array<{ id: string; input: object }>
) {
  const results = [];

  for (const update of updates) {
    try {
      const result = await updateModelRecord(
        modelName,
        update.id,
        update.input
      );
      results.push(result);
    } catch (error) {
      console.error(
        `Failed to update ${modelName} with ID ${update.id}:`,
        error
      );
      // Continue with other updates even if one fails
    }
  }

  return results;
}
