import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import {
  validateAndSanitizeModelName,
  validateAndSanitizeId,
  validateAndSanitizeIdArray,
  validateAndSanitizeObject,
  sanitizeOrError,
  validateLimit,
  validateOrError,
} from "../utils/validators";
import { getRetryConfigForOperation } from "../utils/constants";

import { withRetry, RetryConfig } from "../utils/retry";
import { ApiResponse } from "../utils/api";

const GRAPHQL_RETRY_CONFIG = getRetryConfigForOperation("read");

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
 * Generic function to fetch any model type from the database
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "PastJob")
 * @param {string} id - The ID of the record to fetch
 * @returns {Promise<ApiResponse>} - The API response with status code and data/error
 */
export async function fetchModelRecord(
  modelName: string,
  id: string,
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

  const client = generateClient();

  try {
    const fragmentName = getFragmentForModel(sanitizedModelName);

    const query = buildQueryWithFragments(`
      query Get${sanitizedModelName}($id: ID!) {
        get${sanitizedModelName}(id: $id) {
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

    const fetchResult = await withRetry(async () => {
      return await client.graphql({
        query: query,
        variables: { id: sanitizedId },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    if (
      "data" in fetchResult &&
      fetchResult.data?.[`get${sanitizedModelName}`]
    ) {
      return {
        success: true,
        data: fetchResult.data[`get${sanitizedModelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${sanitizedModelName} record with ID: ${sanitizedId} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
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
 * Function to fetch multiple records of the same model type
 *
 * @param {string} modelName - The name of the model to fetch (e.g., "Education", "PastJob")
 * @param {Object} filter - Optional filter object for the query
 * @param {number} limit - Optional limit for the number of records to fetch
 * @param {string} nextToken - Optional pagination token
 * @returns {Promise<ApiResponse<{items: Object[], nextToken?: string}>>} - API response with array of fetched records
 */
export async function listModelRecords(
  modelName: string,
  filter?: object,
  limit?: number,
  nextToken?: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize filter if provided
  let sanitizedFilter = filter;
  if (filter !== undefined) {
    const filterResult = sanitizeOrError(
      validateAndSanitizeObject(filter, "filter", {
        preserveFields: [
          "eq",
          "ne",
          "gt",
          "lt",
          "ge",
          "le",
          "contains",
          "notContains",
          "between",
          "beginsWith",
        ],
        escapeHtml: false,
        maxLength: 5000,
      })
    );
    if (!filterResult.success) return filterResult.error;
    sanitizedFilter = filterResult.sanitized;
  }

  // Validate limit (no sanitization needed for numbers)
  if (limit !== undefined) {
    const limitValidation = validateOrError(validateLimit(limit));
    if (limitValidation) return limitValidation;
  }

  // Sanitize nextToken if provided (it's a string from GraphQL)
  let sanitizedNextToken = nextToken;
  if (nextToken !== undefined && nextToken !== null) {
    const tokenResult = sanitizeOrError(
      validateAndSanitizeId(nextToken, "nextToken")
    );
    if (!tokenResult.success) return tokenResult.error;
    sanitizedNextToken = tokenResult.sanitized;
  }

  const client = generateClient();

  try {
    const fragmentName = getFragmentForModel(sanitizedModelName);

    const query = buildQueryWithFragments(`
      query List${sanitizedModelName}s($filter: Model${sanitizedModelName}FilterInput, $limit: Int, $nextToken: String) {
        list${sanitizedModelName}s(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
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
          nextToken
        }
      }
    `);

    const listResult = await withRetry(async () => {
      return await client.graphql({
        query: query,
        variables: {
          filter: sanitizedFilter,
          limit,
          nextToken: sanitizedNextToken,
        },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    if (
      "data" in listResult &&
      listResult.data?.[`list${sanitizedModelName}s`]
    ) {
      return {
        success: true,
        data: {
          items: listResult.data[`list${sanitizedModelName}s`].items || [],
          nextToken: listResult.data[`list${sanitizedModelName}s`].nextToken,
        },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `Failed to list ${sanitizedModelName} records`,
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError("list", sanitizedModelName, error);
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Batch fetch multiple records by IDs
 *
 * @param {string} modelName - The name of the model to fetch
 * @param {string[]} ids - Array of IDs to fetch
 * @returns {Promise<ApiResponse<{found: any[], notFound: string[]}>>} - API response with found records
 */
export async function batchFetchModelRecords(
  modelName: string,
  ids: string[]
): Promise<ApiResponse<{ found: any[]; notFound: string[] }>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize model name
  const modelResult = sanitizeOrError(validateAndSanitizeModelName(modelName));
  if (!modelResult.success) return modelResult.error;
  const sanitizedModelName = modelResult.sanitized;

  // Validate and sanitize IDs array
  const idsResult = sanitizeOrError(validateAndSanitizeIdArray(ids, "ids"));
  if (!idsResult.success) return idsResult.error;
  const sanitizedIds = idsResult.sanitized;

  const found: any[] = [];
  const notFound: string[] = [];

  for (const id of sanitizedIds) {
    try {
      // Use internal function to avoid double auth check
      // IDs are already sanitized
      const result = await fetchModelRecordInternal(sanitizedModelName, id);
      if (result.success && result.data) {
        found.push(result.data);
      } else {
        notFound.push(id);
      }
    } catch (error) {
      const errorResult = handleError("fetch", sanitizedModelName, error, id);
      console.error(
        `Failed to fetch ${sanitizedModelName} with ID ${id}:`,
        errorResult.error
      );
      notFound.push(id);
    }
  }

  return {
    success: true,
    data: { found, notFound },
    statusCode: 200,
    ...(notFound.length > 0 && {
      error: `${notFound.length} of ${sanitizedIds.length} ${sanitizedModelName} records not found`,
    }),
  };
}

/**
 * Internal fetch function without auth check (for batch operations)
 * modelName and id are already sanitized by the calling function
 */
async function fetchModelRecordInternal(
  sanitizedModelName: string,
  sanitizedId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const client = generateClient();

  try {
    const fragmentName = getFragmentForModel(sanitizedModelName);

    const query = buildQueryWithFragments(`
      query Get${sanitizedModelName}($id: ID!) {
        get${sanitizedModelName}(id: $id) {
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

    const fetchResult = await withRetry(async () => {
      return await client.graphql({
        query: query,
        variables: { id: sanitizedId },
        authMode: "userPool",
      });
    }, retryConfig || GRAPHQL_RETRY_CONFIG);

    if (
      "data" in fetchResult &&
      fetchResult.data?.[`get${sanitizedModelName}`]
    ) {
      return {
        success: true,
        data: fetchResult.data[`get${sanitizedModelName}`],
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `${sanitizedModelName} record with ID: ${sanitizedId} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "fetch",
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
