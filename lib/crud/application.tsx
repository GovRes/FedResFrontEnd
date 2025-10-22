import {
  AwardType,
  EducationType,
  PastJobType,
  QualificationType,
  ResumeType,
} from "../utils/responseSchemas";
import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";
import { validateAuth } from "../utils/authValidation";
import { handleError } from "../utils/errorHandler";
import {
  validateAndSanitizeId,
  validateAndSanitizeObject,
  validateAndSanitizeNonEmptyString,
  sanitizeOrError,
  sanitizeString,
} from "../utils/validators";
import { withRetry, withBatchRetry, RetryConfig } from "../utils/retry";
import { HTTP_STATUS, RETRY_CONFIG } from "../utils/constants";
import { ApiResponse } from "../utils/api";

type AssociationType =
  | "Award"
  | "Education"
  | "PastJob"
  | "Qualification"
  | "Resume";

type AssociationTypeMap = {
  Award: AwardType;
  Education: EducationType;
  PastJob: PastJobType;
  Qualification: QualificationType;
  Resume: ResumeType;
};

// Configuration constants
const JOIN_TABLE_CONFIG = {
  AwardApplication: ["awardId", "applicationId"],
  EducationApplication: ["educationId", "applicationId"],
  PastJobApplication: ["pastJobId", "applicationId"],
  QualificationApplication: ["qualificationId", "applicationId"],
} as const;

const JOIN_TABLES = Object.keys(JOIN_TABLE_CONFIG) as Array<
  keyof typeof JOIN_TABLE_CONFIG
>;
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: RETRY_CONFIG.DEFAULT_MAX_ATTEMPTS,
  baseDelay: RETRY_CONFIG.DEFAULT_BASE_DELAY,
  maxDelay: RETRY_CONFIG.DEFAULT_MAX_DELAY,
};

const READ_RETRY_CONFIG: RetryConfig = {
  maxAttempts: RETRY_CONFIG.AGGRESSIVE_MAX_ATTEMPTS,
  baseDelay: RETRY_CONFIG.AGGRESSIVE_BASE_DELAY,
  maxDelay: RETRY_CONFIG.AGGRESSIVE_MAX_DELAY,
};

const WRITE_RETRY_CONFIG: RetryConfig = {
  maxAttempts: RETRY_CONFIG.CONSERVATIVE_MAX_ATTEMPTS,
  baseDelay: RETRY_CONFIG.CONSERVATIVE_BASE_DELAY,
  maxDelay: RETRY_CONFIG.CONSERVATIVE_MAX_DELAY,
};

// Valid association types for sanitization
const VALID_ASSOCIATION_TYPES: AssociationType[] = [
  "Award",
  "Education",
  "PastJob",
  "Qualification",
  "Resume",
];

/**
 * Higher-order function to wrap API operations with auth, error handling, and client generation
 */
async function withApiWrapper<T>(
  operation: (client: any) => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse<T>;
  }

  const client = generateClient();

  try {
    return await operation(client);
  } catch (error) {
    // Let the operation handle its own error if it throws an ApiResponse
    if (error && typeof error === "object" && "success" in error) {
      return error as ApiResponse<T>;
    }
    // Handle unexpected errors by converting them to ApiResponse
    const errorResult = handleError("operation", "API", error);
    return {
      success: false,
      error: errorResult.error,
      statusCode: errorResult.statusCode,
    } as ApiResponse<T>;
  }
}

/**
 * Create success response
 */
function successResponse<T>(
  data: T,
  statusCode: number = HTTP_STATUS.OK
): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
  };
}

/**
 * Create error response for unexpected GraphQL format
 */
function unexpectedFormatError(context?: string): ApiResponse {
  return {
    success: false,
    error: context
      ? `Unexpected response format from GraphQL operation for ${context}`
      : "Unexpected response format from GraphQL operation",
    statusCode: 500,
  };
}

/**
 * Helper function to deduplicate items by ID with chunking for large datasets
 * IMPROVED: Added chunking for better memory management
 */
function deduplicateById<T extends { id?: string | null }>(
  items: T[],
  chunkSize: number = 1000
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  // For small arrays, use simple approach
  if (items.length <= chunkSize) {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (!item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  // For large arrays, process in chunks with GC hints
  const seen = new Set<string>();
  const result: T[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    for (const item of chunk) {
      if (item.id && !seen.has(item.id)) {
        seen.add(item.id);
        result.push(item);
      }
    }

    // Allow garbage collection between chunks
    if (typeof global !== "undefined" && global.gc) {
      global.gc();
    }
  }

  return result;
}

/**
 * Extract application IDs from junction table items
 */
function extractApplicationIds(qualification: any): string[] {
  return (
    qualification.applications?.items?.map((app: any) => app.applicationId) ||
    []
  );
}

/**
 * Transform a single qualification with its relationships
 */
function transformQualification(
  qualification: any,
  includeApplicationIds = true
): any {
  const base = {
    id: qualification.id || "",
    title: qualification.title || "",
    description: qualification.description || "",
    paragraph: qualification.paragraph,
    question: qualification.question,
    userConfirmed: qualification.userConfirmed || false,
    userId: qualification.userId,
    pastJobId: qualification.pastJobId,
    topicId: qualification.topicId,
    topic: qualification.topic || null,
  };

  if (includeApplicationIds) {
    return { ...base, applicationIds: extractApplicationIds(qualification) };
  }

  return base;
}

/**
 * Transform a single PastJob with its qualifications
 */
function transformPastJob(
  pastJob: any,
  includeApplicationIds = true
): PastJobType {
  const hours = pastJob.hours !== undefined ? String(pastJob.hours) : undefined;

  const qualifications = (pastJob.qualifications?.items || []).map(
    (qualification: any) =>
      transformQualification(qualification, includeApplicationIds)
  );

  return { ...pastJob, hours, qualifications };
}

/**
 * Transform a single Qualification with its pastJob relationship
 */
function transformQualificationWithPastJob(
  qualification: any
): QualificationType {
  return {
    ...qualification,
    pastJob: qualification.pastJob || null,
    topic: qualification.topic || null,
  };
}

/**
 * Transform junction table items to their associated entities
 * IMPROVED: Added chunking for large datasets
 */
function extractAssociatedEntities<T extends { id?: string | null }>(
  junctionItems: any[],
  entityFieldName: string,
  chunkSize: number = 1000
): T[] {
  if (!Array.isArray(junctionItems) || junctionItems.length === 0) return [];

  // For small arrays, use simple approach
  if (junctionItems.length <= chunkSize) {
    return junctionItems
      .map((item: any) => item[entityFieldName])
      .filter(Boolean);
  }

  // For large arrays, process in chunks with GC hints
  const result: T[] = [];

  for (let i = 0; i < junctionItems.length; i += chunkSize) {
    const chunk = junctionItems.slice(i, i + chunkSize);

    for (const item of chunk) {
      const entity = item[entityFieldName];
      if (entity) {
        result.push(entity);
      }
    }

    // Allow garbage collection between chunks
    if (typeof global !== "undefined" && global.gc) {
      global.gc();
    }
  }

  return result;
}

/**
 * Validate and sanitize association type
 */
function validateAndSanitizeAssociationType(associationType: string): {
  isValid: boolean;
  sanitized: AssociationType;
  error?: string;
} {
  const sanitized = sanitizeString(associationType);

  if (!VALID_ASSOCIATION_TYPES.includes(sanitized as AssociationType)) {
    return {
      isValid: false,
      sanitized: sanitized as AssociationType,
      error: `Invalid association type: ${sanitized}. Must be one of: ${VALID_ASSOCIATION_TYPES.join(", ")}`,
    };
  }

  return {
    isValid: true,
    sanitized: sanitized as AssociationType,
  };
}

/**
 * Build query for association type
 */
function buildAssociationQuery(associationType: AssociationType): string {
  const queryName = `list${associationType}Applications`;
  const entityFieldName = `${associationType.charAt(0).toLowerCase() + associationType.slice(1)}`;

  const queryMap: Record<AssociationType, string> = {
    Award: `
      query List${associationType}Applications($filter: Model${associationType}ApplicationFilterInput) {
        ${queryName}(filter: $filter) {
          items {
            ...AwardApplicationFields
            ${entityFieldName} {
              ...AwardFields
            }
          }
        }
      }
    `,
    Education: `
      query List${associationType}Applications($filter: Model${associationType}ApplicationFilterInput) {
        ${queryName}(filter: $filter) {
          items {
            ...EducationApplicationFields
            ${entityFieldName} {
              ...EducationFields
            }
          }
        }
      }
    `,
    PastJob: `
      query List${associationType}Applications($filter: Model${associationType}ApplicationFilterInput) {
        ${queryName}(filter: $filter) {
          items {
            ...PastJobApplicationFields
            ${entityFieldName} {
              ...PastJobWithQualificationsFields
            }
          }
        }
      }
    `,
    Qualification: `
      query List${associationType}Applications($filter: Model${associationType}ApplicationFilterInput) {
        ${queryName}(filter: $filter) {
          items {
            ...QualificationApplicationFields
            ${entityFieldName} {
              ...QualificationWithPastJobFields
            }
          }
        }
      }
    `,
    Resume: `
      query List${associationType}Applications($filter: Model${associationType}ApplicationFilterInput) {
        ${queryName}(filter: $filter) {
          items {
            id
            applicationId
            ${entityFieldName}Id
            ${entityFieldName} {
              ...ResumeFields
            }
            createdAt
            updatedAt
          }
        }
      }
    `,
  };

  return buildQueryWithFragments(queryMap[associationType]);
}

/**
 * Associate items with an application
 */
export const associateItemsWithApplication = async ({
  applicationId,
  items,
  associationType,
  retryConfig,
}: {
  applicationId: string;
  items: { id: string }[] | string[];
  associationType: AssociationType;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  console.log(items, associationType);

  return withApiWrapper(async (client) => {
    // Validate and sanitize applicationId
    const appIdResult = sanitizeOrError(
      validateAndSanitizeId(applicationId, "applicationId")
    );
    if (!appIdResult.success) return appIdResult.error;
    const sanitizedApplicationId = appIdResult.sanitized;

    // Validate items is a non-empty array
    if (!Array.isArray(items) || items.length === 0) {
      return {
        success: false,
        error: "Invalid items: items must be a non-empty array",
        statusCode: 400,
      };
    }

    // Sanitize items array - handle both string[] and {id: string}[]
    const sanitizedItems: (string | { id: string })[] = items.map((item) => {
      if (typeof item === "string") {
        const idResult = validateAndSanitizeId(item, "item");
        return idResult.isValid ? idResult.sanitized : item;
      } else if (item && typeof item === "object" && "id" in item) {
        const idResult = validateAndSanitizeId(item.id, "item.id");
        return idResult.isValid ? { id: idResult.sanitized } : item;
      }
      return item;
    });

    // Validate and sanitize association type
    const assocTypeResult = sanitizeOrError(
      validateAndSanitizeAssociationType(associationType)
    );
    if (!assocTypeResult.success) return assocTypeResult.error;
    const sanitizedAssociationType = assocTypeResult.sanitized;

    const itemIds = sanitizedItems.map((item) =>
      typeof item === "string" ? item : item.id
    );

    const mutationName = `create${sanitizedAssociationType}Application`;
    const itemIdFieldName = `${sanitizedAssociationType.charAt(0).toLowerCase() + sanitizedAssociationType.slice(1)}Id`;
    const listQueryName = `list${sanitizedAssociationType}Applications`;

    // Check for existing associations
    const existingAssociationsQuery = buildQueryWithFragments(`
      query List${sanitizedAssociationType}Applications($filter: Model${sanitizedAssociationType}ApplicationFilterInput) {
        ${listQueryName}(filter: $filter) {
          items {
            ${itemIdFieldName}
            applicationId
          }
        }
      }
    `);

    const existingResponse = await withRetry(async () => {
      return await client.graphql({
        query: existingAssociationsQuery,
        variables: {
          filter: { applicationId: { eq: sanitizedApplicationId } },
        },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    const existingItemIds = new Set<string>();
    if (
      "data" in existingResponse &&
      existingResponse.data[listQueryName]?.items
    ) {
      existingResponse.data[listQueryName].items.forEach((item: any) => {
        existingItemIds.add(item[itemIdFieldName]);
      });
    }

    const newItemIds = itemIds.filter((itemId) => !existingItemIds.has(itemId));

    if (newItemIds.length === 0) {
      console.log(
        `All ${sanitizedAssociationType} items are already associated`
      );
      return successResponse([], HTTP_STATUS.OK);
    }

    console.log(
      `Creating ${newItemIds.length} new associations out of ${itemIds.length} total items`
    );

    // Create connections for new items using withBatchRetry
    interface JunctionTableRecord {
      applicationId: string;
      [key: string]: string;
    }

    const { successful, failed } = await withBatchRetry(
      newItemIds,
      async (itemId) => {
        const input = {
          [itemIdFieldName]: itemId,
          applicationId: sanitizedApplicationId,
        };

        const createMutation = buildQueryWithFragments(`
          mutation Create${sanitizedAssociationType}Application($input: Create${sanitizedAssociationType}ApplicationInput!) {
            ${mutationName}(input: $input) {
              ${itemIdFieldName}
              applicationId
            }
          }
        `);

        const response = await client.graphql({
          query: createMutation,
          variables: { input },
          authMode: "userPool",
        });

        if ("data" in response && response.data[mutationName]) {
          console.log(
            `Successfully created association for ${sanitizedAssociationType} ${itemId}`
          );
          return response.data[mutationName] as JunctionTableRecord;
        } else {
          throw new Error(
            `Failed to create association for ${sanitizedAssociationType} ${itemId}: Unexpected response format`
          );
        }
      },
      retryConfig || WRITE_RETRY_CONFIG
    );

    const createdConnections = successful;
    const errors = failed.map(
      ({ item, error }) =>
        `Failed to create association for ${sanitizedAssociationType} ${item}: ${error?.message || String(error)}`
    );

    if (errors.length > 0 && createdConnections.length === 0) {
      return {
        success: false,
        error: `Failed to create any associations: ${errors.join("; ")}`,
        statusCode: 500,
      };
    } else if (errors.length > 0) {
      return {
        success: true,
        data: createdConnections,
        statusCode: HTTP_STATUS.MULTI_STATUS,
        error: `Some associations failed: ${errors.join("; ")}`,
      };
    }

    return successResponse(createdConnections, HTTP_STATUS.CREATED);
  });
};

/**
 * Create and save a new application
 */
export const createAndSaveApplication = async ({
  jobId,
  userId,
  retryConfig,
}: {
  jobId: string;
  userId: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    // Validate and sanitize jobId
    const jobIdResult = sanitizeOrError(validateAndSanitizeId(jobId, "jobId"));
    if (!jobIdResult.success) return jobIdResult.error;
    const sanitizedJobId = jobIdResult.sanitized;

    // Validate and sanitize userId
    const userIdResult = sanitizeOrError(
      validateAndSanitizeId(userId, "userId")
    );
    if (!userIdResult.success) return userIdResult.error;
    const sanitizedUserId = userIdResult.sanitized;

    const createMutation = buildQueryWithFragments(`
      mutation CreateApplication($input: CreateApplicationInput!) {
        createApplication(input: $input) {
          ...ApplicationFields
        }
      }
    `);

    const createVariables = {
      input: { jobId: sanitizedJobId, userId: sanitizedUserId },
    } as any;

    const response = await withRetry(async () => {
      return await client.graphql({
        query: createMutation,
        variables: createVariables,
        authMode: "userPool",
      });
    }, retryConfig || WRITE_RETRY_CONFIG);

    if ("data" in response) {
      return successResponse(
        response.data.createApplication,
        HTTP_STATUS.CREATED
      );
    }

    return unexpectedFormatError();
  });
};

/**
 * Get all associations of a specific type for an application
 */
export const getApplicationAssociations = async <T extends AssociationType>({
  applicationId,
  associationType,
  retryConfig,
}: {
  applicationId: string;
  associationType: T;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse<AssociationTypeMap[T][]>> => {
  console.log(337, applicationId, associationType);

  return withApiWrapper(async (client) => {
    // Validate and sanitize applicationId
    const appIdResult = sanitizeOrError(
      validateAndSanitizeId(applicationId, "applicationId")
    );
    if (!appIdResult.success) return appIdResult.error;
    const sanitizedApplicationId = appIdResult.sanitized;

    // Validate and sanitize association type
    const assocTypeResult = sanitizeOrError(
      validateAndSanitizeAssociationType(associationType)
    );
    if (!assocTypeResult.success) return assocTypeResult.error;
    const sanitizedAssociationType = assocTypeResult.sanitized;

    const queryName = `list${sanitizedAssociationType}Applications`;
    const entityFieldName = `${sanitizedAssociationType.charAt(0).toLowerCase() + sanitizedAssociationType.slice(1)}`;
    const query = buildAssociationQuery(sanitizedAssociationType);

    const junctionResponse = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: {
          filter: { applicationId: { eq: sanitizedApplicationId } },
        } as any,
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if (!("data" in junctionResponse)) {
      return unexpectedFormatError(sanitizedAssociationType);
    }

    const junctionItems = junctionResponse.data[queryName].items;
    const associatedItems = extractAssociatedEntities(
      junctionItems,
      entityFieldName
    );
    const uniqueItems = deduplicateById(associatedItems);

    // Type-specific transformations
    if (sanitizedAssociationType === "PastJob") {
      const transformedItems = uniqueItems.map((item: any) =>
        transformPastJob(item, true)
      ) as AssociationTypeMap[T][];
      return successResponse(transformedItems);
    }

    if (sanitizedAssociationType === "Qualification") {
      const transformedItems = uniqueItems.map((item: any) =>
        transformQualificationWithPastJob(item)
      ) as AssociationTypeMap[T][];
      return successResponse(transformedItems);
    }

    return successResponse(uniqueItems as AssociationTypeMap[T][]);
  });
};

export const getApplicationPastJobs = async ({
  applicationId,
  retryConfig,
}: {
  applicationId: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse<PastJobType[]>> => {
  console.log(337, applicationId, "PastJob");

  return withApiWrapper(async (client) => {
    // Validate and sanitize applicationId
    const appIdResult = sanitizeOrError(
      validateAndSanitizeId(applicationId, "applicationId")
    );
    if (!appIdResult.success) return appIdResult.error;
    const sanitizedApplicationId = appIdResult.sanitized;

    const query = buildQueryWithFragments(`
      query ListPastJobApplications($filter: ModelPastJobApplicationFilterInput) {
        listPastJobApplications(filter: $filter) {
          items {
            ...PastJobApplicationFields
            pastJob {
              ...PastJobBasicFields
              qualifications {
                items {
                  ...QualificationWithTopicFields
                }
              }
            }
          }
        }
      }
    `);

    const junctionResponse = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: {
          filter: { applicationId: { eq: sanitizedApplicationId } },
        } as any,
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if (!("data" in junctionResponse)) {
      return unexpectedFormatError("PastJob");
    }

    const junctionItems = junctionResponse.data.listPastJobApplications.items;
    const associatedItems = extractAssociatedEntities(junctionItems, "pastJob");
    const uniqueItems = deduplicateById(associatedItems);
    const transformedItems = uniqueItems.map((item: any) =>
      transformPastJob(item, true)
    );

    return successResponse(transformedItems);
  });
};

/**
 * Get application with job details
 */
export const getApplicationWithJob = async ({
  id,
  retryConfig,
}: {
  id: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    // Validate and sanitize id
    const idResult = sanitizeOrError(validateAndSanitizeId(id, "id"));
    if (!idResult.success) return idResult.error;
    const sanitizedId = idResult.sanitized;

    const query = buildQueryWithFragments(`
      query GetApplication($id: ID!) {
        getApplication(id: $id) {
          ...ApplicationFields
          job {
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

    const response = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: { id: sanitizedId },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if (!("data" in response)) {
      return unexpectedFormatError();
    }

    const application = response.data.getApplication;
    if (!application) {
      return {
        success: false,
        error: `Application with id: ${sanitizedId} not found`,
        statusCode: 404,
      };
    }

    // Flatten topics
    if (application?.job?.topics?.items) {
      application.job.topics = application.job.topics.items;
    }

    return successResponse(application);
  });
};

/**
 * Get application with job details and qualifications
 */
export const getApplicationWithJobAndQualifications = async ({
  id,
  retryConfig,
}: {
  id: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    // Validate and sanitize id
    const idResult = sanitizeOrError(validateAndSanitizeId(id, "id"));
    if (!idResult.success) return idResult.error;
    const sanitizedId = idResult.sanitized;

    const query = buildQueryWithFragments(`
      query GetApplication($id: ID!) {
        getApplication(id: $id) {
          ...ApplicationFields
          job {
            ...JobDetailedFields
            topics {
              items {
                ...TopicFields
              }
            }
          }
          qualifications {
            items {
              ...QualificationApplicationFields
              qualification {
                ...QualificationWithPastJobFields
              }
            }
          }
        }
      }
    `);

    const response = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: { id: sanitizedId },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if (!("data" in response)) {
      return unexpectedFormatError();
    }

    const application = response.data.getApplication;
    if (!application) {
      return {
        success: false,
        error: `Application with id: ${sanitizedId} not found`,
        statusCode: 404,
      };
    }

    // Flatten topics
    if (application?.job?.topics?.items) {
      application.job.topics = application.job.topics.items;
    }

    return successResponse(application);
  });
};

/**
 * Get application with all associations
 * IMPROVED: More efficient transformation with better memory management
 */
export const getApplicationWithAllAssociations = async ({
  id,
  retryConfig,
}: {
  id: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    // Validate and sanitize id
    const idResult = sanitizeOrError(validateAndSanitizeId(id, "id"));
    if (!idResult.success) return idResult.error;
    const sanitizedId = idResult.sanitized;

    const query = buildQueryWithFragments(`
      query GetApplicationWithAllAssociations($id: ID!) {
        getApplication(id: $id) {
          ...ApplicationFields
          job {
            ...JobDetailedFields
            topics {
              items {
                ...TopicFields
              }
            }
          }
          awards {
            items {
              ...AwardApplicationFields
              award {
                ...AwardFields
              }
            }
          }
          educations {
            items {
              ...EducationApplicationFields
              education {
                ...EducationFields
              }
            }
          }
          pastJobs {
            items {
              ...PastJobApplicationFields
              pastJob {
                ...PastJobWithQualificationsFields
              }
            }
          }
          qualifications {
            items {
              ...QualificationApplicationFields
              qualification {
                ...QualificationWithPastJobFields
              }
            }
          }
        }
      }
    `);

    const response = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: { id: sanitizedId },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if (!("data" in response)) {
      return unexpectedFormatError();
    }

    const application = response.data.getApplication;
    if (!application) {
      return {
        success: false,
        error: `Application with id: ${sanitizedId} not found`,
        statusCode: 404,
      };
    }

    // Transform the nested data structure with improved memory efficiency
    const transformedApplication = {
      ...application,
      job: {
        ...application.job,
        topics: application.job?.topics?.items || null,
      },
      awards: application.awards?.items
        ? deduplicateById(
            extractAssociatedEntities<AwardType>(
              application.awards.items,
              "award"
            )
          )
        : null,
      educations: application.educations?.items
        ? deduplicateById(
            extractAssociatedEntities<EducationType>(
              application.educations.items,
              "education"
            )
          )
        : null,
      pastJobs: application.pastJobs?.items
        ? deduplicateById(
            extractAssociatedEntities<any>(
              application.pastJobs.items,
              "pastJob"
            )
          ).map((item: any) => transformPastJob(item, false))
        : null,
      qualifications: application.qualifications?.items
        ? deduplicateById(
            extractAssociatedEntities<any>(
              application.qualifications.items,
              "qualification"
            )
          )
            .map((item: any) => transformQualificationWithPastJob(item))
            .sort((a: QualificationType, b: QualificationType) => {
              if (a.id < b.id) return -1;
              return 1;
            })
        : null,
      resumes: application.resumes?.items
        ? deduplicateById(
            extractAssociatedEntities<ResumeType>(
              application.resumes.items,
              "resume"
            )
          )
        : null,
    };

    return successResponse(transformedApplication);
  });
};

/**
 * List all applications
 */
export const listApplications = async (
  retryConfig?: RetryConfig
): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    const query = buildQueryWithFragments(`
      query ListApplications {
        listApplications {
          items {
            ...ApplicationFields
          }
        }
      }
    `);

    const response = await withRetry(async () => {
      return await client.graphql({
        query,
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if ("data" in response) {
      return successResponse(response.data.listApplications.items);
    }

    return unexpectedFormatError();
  });
};

/**
 * List applications for a specific user
 */
export const listUserApplications = async ({
  userId,
  retryConfig,
}: {
  userId: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    // Validate and sanitize userId
    const userIdResult = sanitizeOrError(
      validateAndSanitizeId(userId, "userId")
    );
    if (!userIdResult.success) return userIdResult.error;
    const sanitizedUserId = userIdResult.sanitized;

    const query = buildQueryWithFragments(`
      query ListApplications($filter: ModelApplicationFilterInput) {
        listApplications(filter: $filter) {
          items {
            ...ApplicationFields
            job {
              ...JobFields
              agencyDescription
            }
          }
        }
      }
    `);

    const response = await withRetry(async () => {
      return await client.graphql({
        query,
        variables: { filter: { userId: { eq: sanitizedUserId } } },
        authMode: "userPool",
      });
    }, retryConfig || READ_RETRY_CONFIG);

    if ("data" in response) {
      return successResponse(response.data.listApplications.items);
    }

    return unexpectedFormatError();
  });
};

/**
 * Update an application
 */
export const updateApplication = async ({
  id,
  input,
  retryConfig,
}: {
  id: string;
  input: {
    completedSteps?: string[];
    status?: string;
  };
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    // Validate and sanitize id
    const idResult = sanitizeOrError(validateAndSanitizeId(id, "id"));
    if (!idResult.success) return idResult.error;
    const sanitizedId = idResult.sanitized;

    // Validate and sanitize input object
    const inputResult = sanitizeOrError(
      validateAndSanitizeObject(input, "input", {
        preserveFields: [],
        escapeHtml: false,
        maxLength: 10000,
      })
    );
    if (!inputResult.success) return inputResult.error;
    const sanitizedInput = inputResult.sanitized;

    if (Object.keys(sanitizedInput).length === 0) {
      return {
        success: false,
        error: "At least one field to update is required",
        statusCode: 400,
      };
    }

    const mutation = buildQueryWithFragments(`
      mutation UpdateApplication($input: UpdateApplicationInput!) {
        updateApplication(input: $input) {
          ...ApplicationFields
        }
      }
    `);

    const updateVariables = {
      input: { id: sanitizedId, ...sanitizedInput },
    } as any;

    const response = await withRetry(async () => {
      return await client.graphql({
        query: mutation,
        variables: updateVariables,
        authMode: "userPool",
      });
    }, retryConfig || WRITE_RETRY_CONFIG);

    if ("data" in response) {
      return successResponse(response.data.updateApplication);
    }

    return unexpectedFormatError();
  });
};

/**
 * Delete an application and all its associated join table entries
 * IMPROVED: Uses Promise.allSettled for robust error handling
 */
export const deleteApplication = async ({
  applicationId,
  retryConfig,
}: {
  applicationId: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    // Validate and sanitize applicationId
    const appIdResult = sanitizeOrError(
      validateAndSanitizeId(applicationId, "applicationId")
    );
    if (!appIdResult.success) return appIdResult.error;
    const sanitizedApplicationId = appIdResult.sanitized;

    const deletionErrors: string[] = [];

    // Delete all join table entries for each association type
    // IMPROVED: Use Promise.allSettled instead of Promise.all
    const joinTableResults = await Promise.allSettled(
      JOIN_TABLES.map(async (joinTable) => {
        const keyFields = JOIN_TABLE_CONFIG[joinTable];
        const [relatedIdField] = keyFields;

        const listQuery = buildQueryWithFragments(`
          query List${joinTable}s($filter: Model${joinTable}FilterInput) {
            list${joinTable}s(filter: $filter) {
              items {
                ${keyFields.join("\n                ")}
              }
            }
          }
        `);

        const listVariables = {
          filter: { applicationId: { eq: sanitizedApplicationId } },
        } as any;

        try {
          const listResponse = await withRetry(async () => {
            return await client.graphql({
              query: listQuery,
              variables: listVariables,
              authMode: "userPool",
            });
          }, retryConfig || READ_RETRY_CONFIG);

          if (
            "data" in listResponse &&
            listResponse.data[`list${joinTable}s`]?.items
          ) {
            const joinItems = listResponse.data[`list${joinTable}s`].items;

            // IMPROVED: Use Promise.allSettled for individual deletions
            const deleteResults = await Promise.allSettled(
              joinItems.map(async (item: any) => {
                const deleteQuery = buildQueryWithFragments(`
                  mutation Delete${joinTable}($input: Delete${joinTable}Input!) {
                    delete${joinTable}(input: $input) {
                      ${keyFields.join("\n                      ")}
                    }
                  }
                `);

                const deleteVariables = {
                  input: {
                    [relatedIdField]: item[relatedIdField],
                    applicationId: item.applicationId,
                  },
                } as any;

                return withRetry(async () => {
                  return client.graphql({
                    query: deleteQuery,
                    variables: deleteVariables,
                    authMode: "userPool",
                  });
                }, retryConfig || DEFAULT_RETRY_CONFIG);
              })
            );

            // Collect errors from failed deletions
            deleteResults.forEach((result, index) => {
              if (result.status === "rejected") {
                deletionErrors.push(
                  `Failed to delete ${joinTable} item ${index}: ${result.reason?.message || String(result.reason)}`
                );
              }
            });
          }
        } catch (error) {
          deletionErrors.push(
            `Failed to process ${joinTable}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      })
    );

    // Check for join table processing failures
    joinTableResults.forEach((result, index) => {
      if (result.status === "rejected") {
        deletionErrors.push(
          `Failed to process join table ${JOIN_TABLES[index]}: ${result.reason?.message || String(result.reason)}`
        );
      }
    });

    // Delete the application itself
    try {
      const deleteApplicationQuery = buildQueryWithFragments(`
        mutation DeleteApplication($input: DeleteApplicationInput!) {
          deleteApplication(input: $input) {
            ...ApplicationFields
          }
        }
      `);

      const deleteVariables = { input: { id: sanitizedApplicationId } } as any;

      const deleteResponse = await withRetry(async () => {
        return await client.graphql({
          query: deleteApplicationQuery,
          variables: deleteVariables,
          authMode: "userPool",
        });
      }, retryConfig || DEFAULT_RETRY_CONFIG);

      if ("data" in deleteResponse) {
        // If there were any deletion errors, include them in the response
        if (deletionErrors.length > 0) {
          return {
            success: true,
            data: deleteResponse.data.deleteApplication,
            statusCode: HTTP_STATUS.MULTI_STATUS,
            error: `Application deleted but some join table entries failed: ${deletionErrors.join("; ")}`,
          };
        }
        return successResponse(deleteResponse.data.deleteApplication);
      }

      return unexpectedFormatError();
    } catch (error) {
      // Application deletion failed
      return {
        success: false,
        error: `Failed to delete application: ${error instanceof Error ? error.message : String(error)}. Join table errors: ${deletionErrors.join("; ")}`,
        statusCode: 500,
      };
    }
  });
};

/**
 * Helper function to delete a single item from a join table using composite keys
 */
export const deleteJoinTableItem = async ({
  relatedId,
  applicationId,
  tableName,
  retryConfig,
}: {
  relatedId: string;
  applicationId: string;
  tableName: string;
  retryConfig?: RetryConfig;
}): Promise<ApiResponse> => {
  return withApiWrapper(async (client) => {
    // Validate and sanitize relatedId
    const relatedIdResult = sanitizeOrError(
      validateAndSanitizeId(relatedId, "relatedId")
    );
    if (!relatedIdResult.success) return relatedIdResult.error;
    const sanitizedRelatedId = relatedIdResult.sanitized;

    // Validate and sanitize applicationId
    const appIdResult = sanitizeOrError(
      validateAndSanitizeId(applicationId, "applicationId")
    );
    if (!appIdResult.success) return appIdResult.error;
    const sanitizedApplicationId = appIdResult.sanitized;

    // Validate and sanitize tableName
    const tableNameResult = sanitizeOrError(
      validateAndSanitizeNonEmptyString(tableName, "tableName", {
        escapeHtml: false,
        maxLength: 100,
      })
    );
    if (!tableNameResult.success) return tableNameResult.error;
    const sanitizedTableName = tableNameResult.sanitized;

    const keyFields =
      JOIN_TABLE_CONFIG[sanitizedTableName as keyof typeof JOIN_TABLE_CONFIG];
    if (!keyFields) {
      return {
        success: false,
        error: `Unknown table name: ${sanitizedTableName}`,
        statusCode: 400,
      };
    }

    const [relatedIdField] = keyFields;

    const deleteQuery = buildQueryWithFragments(`
      mutation Delete${sanitizedTableName}($input: Delete${sanitizedTableName}Input!) {
        delete${sanitizedTableName}(input: $input) {
          ${keyFields.join("\n          ")}
        }
      }
    `);

    const deleteVariables = {
      input: {
        [relatedIdField]: sanitizedRelatedId,
        applicationId: sanitizedApplicationId,
      },
    } as any;

    const response = await withRetry(async () => {
      return await client.graphql({
        query: deleteQuery,
        variables: deleteVariables,
        authMode: "userPool",
      });
    }, retryConfig || DEFAULT_RETRY_CONFIG);

    if ("data" in response) {
      return successResponse(response.data[`delete${sanitizedTableName}`]);
    }

    return unexpectedFormatError(sanitizedTableName);
  });
};
