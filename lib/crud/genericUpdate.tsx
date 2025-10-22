import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import {
  validateAndSanitizeModelName,
  validateAndSanitizeId,
  validateAndSanitizeObject,
  validateAndSanitizeArray,
  sanitizeOrError,
} from "../utils/validators";
import { getRetryConfigForOperation } from "../utils/constants";
import { withRetry, withBatchRetry, RetryConfig } from "../utils/retry";
import { ApiResponse } from "../utils/api";
const GRAPHQL_RETRY_CONFIG = getRetryConfigForOperation("write");
function getFragmentForModel(modelName: string): string {
  const fragmentMap: Record<string, string> = {
    Application: "ApplicationFields",
    Award: "AwardFields",
    Education: "EducationFields",
    Job: "JobDetailedFields",
    Resume: "ResumeFields",
    Topic: "TopicFields",
    PastJob: "PastJobFields",
    Qualification: "QualificationFields",
    AwardApplication: "AwardApplicationFields",
    EducationApplication: "EducationApplicationFields",
    QualificationApplication: "QualificationApplicationFields",
    PastJobApplication: "PastJobApplicationFields",
    PastJobQualification: "PastJobApplicationFields",
  };

  return fragmentMap[modelName] || "";
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
  input: object,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize ID
  const idResult = sanitizeOrError(validateAndSanitizeId(id, "id"));
  if (!idResult.success) return idResult.error;
  const sanitizedId = idResult.sanitized;

  // Validate and sanitize input object
  const inputResult = sanitizeOrError(
    validateAndSanitizeObject(input, "input", {
      preserveFields: ["id", "createdAt", "updatedAt", "userId", "jobId"],
      escapeHtml: false,
      maxLength: 10000,
    })
  );
  if (!inputResult.success) return inputResult.error;
  const sanitizedInput = inputResult.sanitized;

  const client = generateClient();

  try {
    // Add the ID to the input object
    const updateInput = {
      id: sanitizedId,
      ...sanitizedInput,
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

    const fragmentName = getFragmentForModel(sanitizedModelName);

    // Create the GraphQL mutation query using fragments
    const mutation = buildQueryWithFragments(`
      mutation Update${sanitizedModelName}($input: Update${sanitizedModelName}Input!) {
        update${sanitizedModelName}(input: $input) {
          ${
            fragmentName
              ? `...${fragmentName}`
              : `
            id
            createdAt
            updatedAt
          `
          }
        }
      }
    `);

    // Execute the GraphQL mutation
    const updateResult = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: filteredUpdateData,
        },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    // Verify successful update
    if (
      "data" in updateResult &&
      updateResult.data?.[`update${sanitizedModelName}`]
    ) {
      return {
        success: true,
        data: updateResult.data[`update${sanitizedModelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${sanitizedModelName} record with ID: ${sanitizedId} not found or could not be updated`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "update",
      sanitizedModelName,
      error,
      sanitizedId
    );
    return {
      success: false,
      ...errorResult,
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
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize updates array
  const updatesResult = sanitizeOrError(
    validateAndSanitizeArray(updates, "updates", (update) => {
      // Sanitize each update object
      const idResult = validateAndSanitizeId(update.id, "id");
      const inputResult = validateAndSanitizeObject(update.input, "input", {
        preserveFields: ["id", "createdAt", "updatedAt", "userId", "jobId"],
        escapeHtml: false,
        maxLength: 10000,
      });

      if (!idResult.isValid || !inputResult.isValid) {
        return update; // Keep original if sanitization fails
      }

      return {
        id: idResult.sanitized,
        input: inputResult.sanitized,
      };
    })
  );
  if (!updatesResult.success) return updatesResult.error;
  const sanitizedUpdates = updatesResult.sanitized;

  // Validate the structure of sanitized updates array
  const invalidUpdates = sanitizedUpdates.filter(
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
  for (const update of sanitizedUpdates) {
    try {
      // Use internal function to avoid double auth check
      // Data is already sanitized
      const result = await updateModelRecordInternal(
        sanitizedModelName,
        update.id,
        update.input
      );
      if (result.success && result.data) {
        updated.push(result.data);
      } else {
        failed.push({
          id: update.id,
          input: update.input,
          error:
            result.error || `Failed to update ${sanitizedModelName} record`,
        });
      }
    } catch (error) {
      const errorResult = handleError(
        "update",
        sanitizedModelName,
        error,
        update.id
      );
      failed.push({
        id: update.id,
        input: update.input,
        error: errorResult.error,
      });
    }
  }

  // Determine overall success status
  const hasUpdated = updated.length > 0;
  const hasFailed = failed.length > 0;
  const allFailed = failed.length === sanitizedUpdates.length;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to update all ${sanitizedUpdates.length} ${sanitizedModelName} records`,
      statusCode: 500,
    };
  }

  return {
    success: hasUpdated,
    data: { updated, failed },
    statusCode: hasUpdated ? 200 : 500,
    ...(hasFailed && {
      error: `${failed.length} of ${sanitizedUpdates.length} ${sanitizedModelName} records failed to update`,
    }),
  };
}

/**
 * Internal update function without auth check (for batch operations)
 * This prevents double authentication checks in batch operations
 * Input is already sanitized by the calling function
 */
async function updateModelRecordInternal(
  sanitizedModelName: string,
  sanitizedId: string,
  sanitizedInput: object,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const client = generateClient();

  try {
    // Add the ID to the input object
    const updateInput = {
      id: sanitizedId,
      ...sanitizedInput,
    };

    // Extract fields we don't want to include in the update operation
    const { createdAt, updatedAt, ...withoutTimestamps } = updateInput as any;

    // Remove relationship fields that can't be sent directly in an update mutation
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

    const fragmentName = getFragmentForModel(sanitizedModelName);

    // Create the GraphQL mutation query using fragments
    const mutation = buildQueryWithFragments(`
      mutation Update${sanitizedModelName}($input: Update${sanitizedModelName}Input!) {
        update${sanitizedModelName}(input: $input) {
          ${
            fragmentName
              ? `...${fragmentName}`
              : `
            id
            createdAt
            updatedAt
          `
          }
        }
      }
    `);

    // Execute the GraphQL mutation
    const updateResult = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: filteredUpdateData,
        },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    // Verify successful update
    if (
      "data" in updateResult &&
      updateResult.data?.[`update${sanitizedModelName}`]
    ) {
      return {
        success: true,
        data: updateResult.data[`update${sanitizedModelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${sanitizedModelName} record with ID: ${sanitizedId} not found or could not be updated`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "update",
      sanitizedModelName,
      error,
      sanitizedId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}
