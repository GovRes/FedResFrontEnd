import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import {
  validateAndSanitizeId,
  validateAndSanitizeNonEmptyString,
  validateAndSanitizeObject,
  sanitizeOrError,
} from "../utils/validators";
import { getRetryConfigForOperation } from "../utils/constants";
import { withRetry, RetryConfig } from "../utils/retry";
import { ApiResponse } from "../utils/api";
const READ_RETRY_CONFIG = getRetryConfigForOperation("read");
const WRITE_RETRY_CONFIG = getRetryConfigForOperation("write");
/**
 * Retrieves a job by its usaJobsId
 *
 * @param {string} usaJobsId - The usaJobsId to search for
 * @returns {Promise<ApiResponse>} - The API response with status code and data/error
 */
export async function getJobByUsaJobsId(
  usaJobsId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize usaJobsId
  const usaJobsIdResult = sanitizeOrError(
    validateAndSanitizeNonEmptyString(usaJobsId, "usaJobsId", {
      escapeHtml: false,
      maxLength: 200,
    })
  );
  if (!usaJobsIdResult.success) return usaJobsIdResult.error;
  const sanitizedUsaJobsId = usaJobsIdResult.sanitized;

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query GetJobByUsaJobsId($usaJobsId: String!) {
        listJobs(filter: {usaJobsId: {eq: $usaJobsId}}) {
          items {
            ...JobDetailedFields
            topics {
              items {
                ...TopicFields
              }
            }
          }
        }
      }
    `);

    const result = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: {
          usaJobsId: sanitizedUsaJobsId,
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    // Check if we found a job with that usaJobsId
    if ("data" in result && result.data?.listJobs?.items?.length > 0) {
      // Flatten the topics.items into a topics array
      const job = result.data.listJobs.items[0];
      const flattenedJob = {
        ...job,
        topics: job.topics?.items || [],
      };

      return {
        success: true,
        data: flattenedJob,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: `Job with usaJobsId: ${sanitizedUsaJobsId} not found`,
      statusCode: 404,
    };
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "Job by usaJobsId",
      error,
      sanitizedUsaJobsId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Creates a new Job record or retrieves an existing one with the same usaJobsId
 *
 * @param {Object} jobData - The job data to create
 * @returns {Promise<ApiResponse>} - The API response with created or retrieved job record
 */
export async function createOrGetJob(
  jobData: {
    agencyDescription?: string;
    department?: string;
    duties?: string;
    evaluationCriteria?: string;
    qualificationsSummary?: string;
    requiredDocuments?: string;
    title: string;
    usaJobsId: string;
  },
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize jobData object
  const jobDataResult = sanitizeOrError(
    validateAndSanitizeObject(jobData, "jobData", {
      preserveFields: ["id", "createdAt", "updatedAt"],
      escapeHtml: false,
      maxLength: 50000, // Jobs can have long descriptions
    })
  );
  if (!jobDataResult.success) return jobDataResult.error;
  const sanitizedJobData = jobDataResult.sanitized;

  // Validate required fields after sanitization
  const titleResult = sanitizeOrError(
    validateAndSanitizeNonEmptyString(sanitizedJobData.title, "title", {
      escapeHtml: false,
      maxLength: 500,
    })
  );
  if (!titleResult.success) return titleResult.error;
  const sanitizedTitle = titleResult.sanitized;

  const usaJobsIdResult = sanitizeOrError(
    validateAndSanitizeNonEmptyString(sanitizedJobData.usaJobsId, "usaJobsId", {
      escapeHtml: false,
      maxLength: 200,
    })
  );
  if (!usaJobsIdResult.success) return usaJobsIdResult.error;
  const sanitizedUsaJobsId = usaJobsIdResult.sanitized;

  const client = generateClient();

  try {
    // First, check if a job with this usaJobsId already exists
    // Use internal function to avoid double auth check
    const existingJobResult =
      await getJobByUsaJobsIdInternal(sanitizedUsaJobsId);

    if (existingJobResult.success && existingJobResult.data) {
      return existingJobResult;
    }

    // If no existing job was found, create a new one

    // Extract fields we don't want to include in the create operation
    const { createdAt, id, updatedAt, topics, ...filteredJobData } =
      sanitizedJobData as any;

    // Update with sanitized required fields
    filteredJobData.title = sanitizedTitle;
    filteredJobData.usaJobsId = sanitizedUsaJobsId;

    const mutation = buildQueryWithFragments(`
      mutation CreateJob($input: CreateJobInput!) {
        createJob(input: $input) {
          ...JobDetailedFields
          topics {
            items {
              ...TopicFields
            }
          }
        }
      }
    `);

    // Execute the GraphQL mutation
    const createResult = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: {
          input: filteredJobData,
        },
        authMode: "userPool",
      });
    }, retryConfig || WRITE_RETRY_CONFIG);

    // Verify successful creation
    if ("data" in createResult && createResult.data?.createJob) {
      // Flatten topics structure for consistency
      const createdJob = {
        ...createResult.data.createJob,
        topics: createResult.data.createJob.topics?.items || [],
      };

      return {
        success: true,
        data: createdJob,
        statusCode: 201,
      };
    } else {
      return {
        success: false,
        error: "Failed to create Job record",
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError("create or retrieve", "Job", error);
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Get job by application ID
 *
 * @param {string} applicationId - The application ID
 * @returns {Promise<ApiResponse>} - The API response with job data
 */
export async function getJobByApplicationId(
  applicationId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  // Validate and sanitize applicationId
  const appIdResult = sanitizeOrError(
    validateAndSanitizeId(applicationId, "applicationId")
  );
  if (!appIdResult.success) return appIdResult.error;
  const sanitizedApplicationId = appIdResult.sanitized;

  const client = generateClient();

  try {
    const getApplicationQuery = buildQueryWithFragments(`
      query GetApplication($applicationId: ID!) {
        getApplication(id: $applicationId) {
          id
          jobId
        }
      }
    `);

    const applicationResult = await withRetry(async () => {
      return await client.graphql({
        query: getApplicationQuery,
        variables: {
          applicationId: sanitizedApplicationId,
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if (
      "data" in applicationResult &&
      applicationResult.data?.getApplication?.jobId
    ) {
      const jobId = applicationResult.data.getApplication.jobId;

      // Sanitize the jobId returned from the database
      const jobIdResult = sanitizeOrError(
        validateAndSanitizeId(jobId, "jobId")
      );
      if (!jobIdResult.success) return jobIdResult.error;
      const sanitizedJobId = jobIdResult.sanitized;

      const getJobQuery = buildQueryWithFragments(`
        query GetJob($jobId: ID!) {
          getJob(id: $jobId) {
            ...JobDetailedFields
            topics {
              items {
                ...TopicFields
              }
            }
          }
        }
      `);

      const jobResult = await withRetry(async () => {
        return await client.graphql({
          query: getJobQuery,
          variables: {
            jobId: sanitizedJobId,
          },
          authMode: "userPool",
        });
      }, retryConfig || READ_RETRY_CONFIG);
      if ("data" in jobResult && jobResult.data?.getJob) {
        // Flatten the topics.items into a topics array
        const job = jobResult.data.getJob;
        const flattenedJob = {
          ...job,
          topics: job.topics?.items || [],
        };

        return {
          success: true,
          data: flattenedJob,
          statusCode: 200,
        };
      }
    }

    return {
      success: false,
      error: `Job not found for application ID: ${sanitizedApplicationId}`,
      statusCode: 404,
    };
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "Job by application",
      error,
      sanitizedApplicationId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Internal function to get job by usaJobsId without auth check (for internal use)
 * usaJobsId is already sanitized by the calling function
 */
async function getJobByUsaJobsIdInternal(
  sanitizedUsaJobsId: string,
  retryConfig?: RetryConfig
): Promise<ApiResponse> {
  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query GetJobByUsaJobsId($usaJobsId: String!) {
        listJobs(filter: {usaJobsId: {eq: $usaJobsId}}) {
          items {
            ...JobDetailedFields
            topics {
              items {
                ...TopicFields
              }
            }
          }
        }
      }
    `);

    const result = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: {
          usaJobsId: sanitizedUsaJobsId,
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    // Check if we found a job with that usaJobsId
    if ("data" in result && result.data?.listJobs?.items?.length > 0) {
      // Flatten the topics.items into a topics array
      const job = result.data.listJobs.items[0];
      const flattenedJob = {
        ...job,
        topics: job.topics?.items || [],
      };

      return {
        success: true,
        data: flattenedJob,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: `Job with usaJobsId: ${sanitizedUsaJobsId} not found`,
      statusCode: 404,
    };
  } catch (error) {
    const errorResult = handleError(
      "fetch",
      "Job by usaJobsId",
      error,
      sanitizedUsaJobsId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}
