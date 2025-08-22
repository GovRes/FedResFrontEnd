import { generateClient } from "aws-amplify/api";
import { getModelFields, validateModelName } from "./modelUtils";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Generic function to update any model type in the database
 *
 * @param {string} modelName - The name of the model to update (e.g., "Education", "PastJob")
 * @param {string} id - The ID of the record to update
 * @param {Object} input - The input object with updated fields
 * @returns {Promise<ApiResponse>} - The API response with updated record data
 */
export async function updateModelRecord(
  modelName: string,
  id: string,
  input: object
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

  // Validate the ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    return {
      success: false,
      error: "Invalid ID: ID must be a non-empty string",
      statusCode: 400,
    };
  }

  // Validate the input
  if (!input || typeof input !== "object") {
    return {
      success: false,
      error: "Invalid input: input must be a non-null object",
      statusCode: 400,
    };
  }

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
      "qualifications",
      "applications",
      "educations",
      "resumes",
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

    // Check if there are any fields left to update after filtering
    const fieldsToUpdate = Object.keys(filteredUpdateData).filter(
      (key) => key !== "id"
    );
    if (fieldsToUpdate.length === 0) {
      return {
        success: false,
        error: "No valid fields to update after filtering",
        statusCode: 400,
      };
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
      return {
        success: true,
        data: updateResult.data[`update${modelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${modelName} record with ID: ${id} not found or could not be updated`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error(`Error updating ${modelName} record:`, error);

    // Add this detailed error logging:
    if (error && typeof error === "object" && "errors" in error) {
      console.error("GraphQL Errors:", error.errors);
      error.errors.forEach((err: any, index: number) => {
        console.error(`GraphQL Error ${index + 1}:`, err.message);
        if (err.locations) console.error("Error locations:", err.locations);
        if (err.path) console.error("Error path:", err.path);
      });
    }
    // Check if it's a "not found" error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.toLowerCase().includes("not found") ||
      errorMessage.toLowerCase().includes("does not exist")
    ) {
      return {
        success: false,
        error: `${modelName} record with ID: ${id} not found`,
        statusCode: 404,
      };
    }

    return {
      success: false,
      error: `Failed to update ${modelName} record with ID: ${id}`,
      statusCode: 500,
    };
  }
}
/**
 * Helper function for batch updating of multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to update (e.g., "Education", "PastJob")
 * @param {Array<{id: string, input: object}>} updates - Array of objects with id and input properties
 * @returns {Promise<ApiResponse<{updated: any[], failed: {id: string, input: object, error: string}[]}>>} - API response with updated records and any failures
 */
export async function batchUpdateModelRecords(
  modelName: string,
  updates: Array<{ id: string; input: object }>
): Promise<
  ApiResponse<{
    updated: any[];
    failed: { id: string; input: object; error: string }[];
  }>
> {
  if (!Array.isArray(updates) || updates.length === 0) {
    return {
      success: false,
      error: "Invalid input: updates must be a non-empty array",
      statusCode: 400,
    };
  }

  // Validate the structure of updates array
  const invalidUpdates = updates.filter(
    (update) =>
      !update ||
      typeof update !== "object" ||
      !update.id ||
      typeof update.id !== "string" ||
      update.id.trim() === "" ||
      !update.input ||
      typeof update.input !== "object"
  );

  if (invalidUpdates.length > 0) {
    return {
      success: false,
      error: `Invalid update objects found: ${invalidUpdates.length} updates have missing or invalid id/input properties`,
      statusCode: 400,
    };
  }

  const updated: any[] = [];
  const failed: { id: string; input: object; error: string }[] = [];

  // Process each update sequentially to avoid overwhelming the API
  for (const update of updates) {
    try {
      const result = await updateModelRecord(
        modelName,
        update.id,
        update.input
      );
      if (result.success && result.data) {
        updated.push(result.data);
      } else {
        failed.push({
          id: update.id,
          input: update.input,
          error: result.error || `Failed to update ${modelName} record`,
        });
      }
    } catch (error) {
      console.error(
        `Failed to update ${modelName} with ID ${update.id}:`,
        error
      );
      failed.push({
        id: update.id,
        input: update.input,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Determine overall success status
  const hasUpdated = updated.length > 0;
  const hasFailed = failed.length > 0;
  const allFailed = failed.length === updates.length;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to update all ${updates.length} ${modelName} records`,
      statusCode: 500,
    };
  }

  return {
    success: hasUpdated,
    data: { updated, failed },
    statusCode: hasUpdated ? 200 : 500,
    ...(hasFailed && {
      error: `${failed.length} of ${updates.length} ${modelName} records failed to update`,
    }),
  };
}
/**
 * Example usage:
 *
 * // Update a single education record
 * const updateResult = await updateModelRecord("Education", "abc123", {
 *   school: "Updated University",
 *   degree: "Master of Science",
 *   major: "Computer Science"
 * });
 *
 * if (updateResult.success && updateResult.data) {
 *   console.log("Updated education record:", updateResult.data);
 * } else {
 *   console.error(`Error ${updateResult.statusCode}:`, updateResult.error);
 * }
 *
 * // Update multiple PastJob records
 * const batchUpdateResult = await batchUpdateModelRecords("PastJob", [
 *   {
 *     id: "job1",
 *     input: {
 *       title: "Senior Software Engineer",
 *       organization: "Updated Tech Co"
 *     }
 *   },
 *   {
 *     id: "job2",
 *     input: {
 *       title: "Lead Web Developer",
 *       organization: "Updated Agency Inc"
 *     }
 *   }
 * ]);
 *
 * if (batchUpdateResult.success && batchUpdateResult.data) {
 *   const { updated, failed } = batchUpdateResult.data;
 *   console.log(`Successfully updated ${updated.length} job records:`, updated);
 *
 *   if (failed.length > 0) {
 *     console.warn(`${failed.length} job records failed to update:`, failed);
 *   }
 * } else {
 *   console.error(`Error ${batchUpdateResult.statusCode}:`, batchUpdateResult.error);
 * }
 */
