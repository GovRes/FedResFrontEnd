import { generateClient } from "aws-amplify/api";
import { handleError } from "../utils/errorHandler";
import { ApiResponse } from "../utils/api";

/**
 * The supported entity types that can be fetched for a user
 */
export type AssociationType =
  | "Award"
  | "Education"
  | "PastJob"
  | "Qualification";

/**
 * Generic type for entity records
 */
export type EntityRecord = {
  id?: string | null | undefined;
  userId: string;
  [key: string]: any;
};

/**
 * Fetches all associations of a specific type for the logged-in user.
 *
 * @param {AssociationType} associationType - The type of association to fetch
 * @param {number} limit - Maximum number of records to fetch (default: 1000)
 * @returns {Promise<ApiResponse<T[]>>} - API response with array of association objects belonging to the logged-in user
 */
export async function fetchUserAssociations<T extends EntityRecord>(
  associationType: AssociationType,
  limit: number = 1000
): Promise<ApiResponse<T[]>> {
  // Validate associationType
  const validTypes: AssociationType[] = [
    "Award",
    "Education",
    "PastJob",
    "Qualification",
  ];
  if (!validTypes.includes(associationType)) {
    return {
      success: false,
      error: `Invalid association type: ${associationType}. Must be one of: ${validTypes.join(", ")}`,
      statusCode: 400,
    };
  }

  // Validate limit
  if (limit <= 0 || limit > 10000) {
    return {
      success: false,
      error: "Invalid limit: limit must be between 1 and 10000",
      statusCode: 400,
    };
  }

  const client = generateClient();
  const queryName = `list${associationType}s`;

  try {
    // Create dynamic query based on associationType
    const graphqlQuery = `
      query ${queryName}($limit: Int) {
        ${queryName}(limit: $limit) {
          items {
            id
            ${getFieldsForType(associationType)}
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await client.graphql({
      query: graphqlQuery,
      variables: {
        limit: limit,
      },
      authMode: "userPool",
    });

    // Explicit type checking for the response
    if ("data" in result && result.data?.[queryName]?.items) {
      return {
        success: true,
        data: result.data[queryName].items as T[],
        statusCode: 200,
      };
    } else {
      return {
        success: true,
        data: [] as T[],
        statusCode: 200,
      };
    }
  } catch (error) {
    const errorResult = handleError("fetch", `user ${associationType}s`, error);
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Checks if an entity already exists and creates it if it doesn't.
 *
 * @param {AssociationType} associationType - The type of association to create
 * @param {Object} inputData - The data for the new entity
 * @param {Object} identifierFields - The fields to use for checking if the entity exists
 * @param {string} userId - The user ID to associate with the new entity
 * @returns {Promise<ApiResponse<T>>} - API response with the existing or newly created entity
 */
export async function createIfNotExists<T extends EntityRecord>(
  associationType: AssociationType,
  inputData: Omit<T, "id" | "createdAt" | "updatedAt">,
  identifierFields: string[],
  userId: string
): Promise<ApiResponse<T>> {
  // Validate associationType
  const validTypes: AssociationType[] = [
    "Award",
    "Education",
    "PastJob",
    "Qualification",
  ];
  if (!validTypes.includes(associationType)) {
    return {
      success: false,
      error: `Invalid association type: ${associationType}. Must be one of: ${validTypes.join(", ")}`,
      statusCode: 400,
    };
  }

  // Validate inputData
  if (!inputData || typeof inputData !== "object") {
    return {
      success: false,
      error: "Invalid inputData: inputData must be a non-null object",
      statusCode: 400,
    };
  }

  // Validate identifierFields
  if (!Array.isArray(identifierFields) || identifierFields.length === 0) {
    return {
      success: false,
      error: "Invalid identifierFields: must be a non-empty array",
      statusCode: 400,
    };
  }

  // Validate userId
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return {
      success: false,
      error: "Invalid userId: userId must be a non-empty string",
      statusCode: 400,
    };
  }

  // Validate that all identifier fields exist in inputData
  const missingFields = identifierFields.filter(
    (field) => !(field in inputData)
  );
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Missing identifier fields in inputData: ${missingFields.join(", ")}`,
      statusCode: 400,
    };
  }

  const client = generateClient();
  const listQueryName = `list${associationType}s`;
  const createQueryName = `create${associationType}`;

  try {
    // Build filter for checking existence
    const filterConditions = identifierFields.map((field) => ({
      [field]: { eq: inputData[field] },
    }));

    // Check if entity exists
    const existingQuery = `
      query ${listQueryName}($filter: Model${associationType}FilterInput, $limit: Int) {
        ${listQueryName}(filter: $filter, limit: $limit) {
          items {
            id
            ${getFieldsForType(associationType)}
            createdAt
            updatedAt
          }
        }
      }
    `;

    const existingResult = await client.graphql({
      query: existingQuery,
      variables: {
        filter: {
          and: filterConditions,
        },
        limit: 1,
      },
      authMode: "userPool",
    });

    // Check if entity exists
    if (
      "data" in existingResult &&
      existingResult.data?.[listQueryName]?.items &&
      existingResult.data[listQueryName].items.length > 0
    ) {
      return {
        success: true,
        data: existingResult.data[listQueryName].items[0] as T,
        statusCode: 200,
      };
    }

    // Entity doesn't exist, create it
    const createQuery = `
      mutation ${createQueryName}($input: Create${associationType}Input!) {
        ${createQueryName}(input: $input) {
          id
          ${getFieldsForType(associationType)}
          createdAt
          updatedAt
        }
      }
    `;

    const createResult = await client.graphql({
      query: createQuery,
      variables: {
        input: {
          ...inputData,
          userId,
        },
      },
      authMode: "userPool",
    });

    // Return the created entity
    if ("data" in createResult && createResult.data?.[createQueryName]) {
      return {
        success: true,
        data: createResult.data[createQueryName] as T,
        statusCode: 201,
      };
    } else {
      return {
        success: false,
        error: `Failed to create ${associationType}: No data returned`,
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "create or find",
      associationType,
      error,
      userId
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Creates and saves multiple entities of a specific type, checking if each one already exists.
 *
 * @param {AssociationType} associationType - The type of association to create
 * @param {Object[]} entitiesInput - Array of entity data objects
 * @param {string[]} identifierFields - Fields to use for checking if entities exist
 * @param {string} userId - The user ID to associate with new entities
 * @returns {Promise<ApiResponse<{created: T[], existing: T[], failed: {input: any, error: string}[]}>>} - API response with results breakdown
 */
export async function createAndSaveEntities<T extends EntityRecord>(
  associationType: AssociationType,
  entitiesInput: Omit<T, "id" | "createdAt" | "updatedAt">[],
  identifierFields: string[],
  userId: string
): Promise<
  ApiResponse<{
    created: T[];
    existing: T[];
    failed: { input: any; error: string }[];
  }>
> {
  // Validate entitiesInput
  if (!Array.isArray(entitiesInput) || entitiesInput.length === 0) {
    return {
      success: false,
      error: "Invalid entitiesInput: must be a non-empty array",
      statusCode: 400,
    };
  }

  const created: T[] = [];
  const existing: T[] = [];
  const failed: { input: any; error: string }[] = [];

  // Process each entity in the input array
  for (const entityInput of entitiesInput) {
    try {
      const result = await createIfNotExists<T>(
        associationType,
        entityInput,
        identifierFields,
        userId
      );

      if (result.success && result.data) {
        if (result.statusCode === 201) {
          // Entity was created
          created.push(result.data);
        } else {
          // Entity already existed
          existing.push(result.data);
        }
      } else {
        failed.push({
          input: entityInput,
          error: result.error || `Failed to process ${associationType}`,
        });
      }
    } catch (error) {
      const errorResult = handleError("process", associationType, error);
      failed.push({
        input: entityInput,
        error: errorResult.error,
      });
    }
  }

  // Determine overall success status
  const hasResults = created.length + existing.length > 0;
  const hasFailed = failed.length > 0;
  const allFailed = failed.length === entitiesInput.length;

  if (allFailed) {
    return {
      success: false,
      error: `Failed to process all ${entitiesInput.length} ${associationType} entities`,
      statusCode: 500,
    };
  }

  return {
    success: hasResults,
    data: { created, existing, failed },
    statusCode: hasResults ? 200 : 500,
    ...(hasFailed && {
      error: `${failed.length} of ${entitiesInput.length} ${associationType} entities failed to process`,
    }),
  };
}

/**
 * Creates a relationship between two entities using the appropriate join table.
 *
 * @param parentType - The type of the parent entity
 * @param parentId - The ID of the parent entity
 * @param childType - The type of the child entity
 * @param childId - The ID of the child entity
 * @returns {Promise<ApiResponse<{id: string}>>} - API response with the created relationship ID
 */
export async function createRelationship(
  parentType: AssociationType,
  parentId: string,
  childType: AssociationType,
  childId: string
): Promise<ApiResponse<{ id: string }>> {
  // Validate inputs
  const validTypes: AssociationType[] = [
    "Award",
    "Education",
    "PastJob",
    "Qualification",
  ];

  if (!validTypes.includes(parentType)) {
    return {
      success: false,
      error: `Invalid parent type: ${parentType}. Must be one of: ${validTypes.join(", ")}`,
      statusCode: 400,
    };
  }

  if (!validTypes.includes(childType)) {
    return {
      success: false,
      error: `Invalid child type: ${childType}. Must be one of: ${validTypes.join(", ")}`,
      statusCode: 400,
    };
  }

  if (!parentId || typeof parentId !== "string" || parentId.trim() === "") {
    return {
      success: false,
      error: "Invalid parentId: parentId must be a non-empty string",
      statusCode: 400,
    };
  }

  if (!childId || typeof childId !== "string" || childId.trim() === "") {
    return {
      success: false,
      error: "Invalid childId: childId must be a non-empty string",
      statusCode: 400,
    };
  }

  const client = generateClient();

  // Determine the join table type
  const joinType = `${parentType}${childType}`;
  const createMutationName = `create${joinType}`;

  // Create the parent-child relationship
  const createRelationshipMutation = `
    mutation ${createMutationName}($input: Create${joinType}Input!) {
      ${createMutationName}(input: $input) {
        id
      }
    }
  `;

  const parentIdField = `${
    parentType.charAt(0).toLowerCase() + parentType.slice(1)
  }Id`;
  const childIdField = `${
    childType.charAt(0).toLowerCase() + childType.slice(1)
  }Id`;

  try {
    const result = await client.graphql({
      query: createRelationshipMutation,
      variables: {
        input: {
          [parentIdField]: parentId,
          [childIdField]: childId,
        },
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.[createMutationName]?.id) {
      return {
        success: true,
        data: { id: result.data[createMutationName].id },
        statusCode: 201,
      };
    } else {
      return {
        success: false,
        error: `Failed to create relationship between ${parentType} and ${childType}: No data returned`,
        statusCode: 500,
      };
    }
  } catch (error) {
    const errorResult = handleError(
      "create",
      `relationship between ${parentType} and ${childType}`,
      error
    );
    return {
      success: false,
      ...errorResult,
    };
  }
}

/**
 * Returns the fields to query for a specific entity type.
 *
 * @param associationType - The type of association
 * @returns A string of fields to include in the GraphQL query
 */
function getFieldsForType(associationType: AssociationType): string {
  // Common fields for all types
  const commonFields = ["userId"];

  // Type-specific fields
  const typeSpecificFields: Record<AssociationType, string[]> = {
    Award: ["title", "date"],
    Education: ["degree", "major", "school", "date", "type", "gpa"],
    PastJob: [
      "title",
      "organization",
      "startDate",
      "endDate",
      "hours",
      "gsLevel",
      "responsibilities",
      "type",
    ],
    Qualification: [
      "title",
      "description",
      "paragraph",
      "userConfirmed",
      "topicId",
    ],
  };

  const fields = [...commonFields, ...typeSpecificFields[associationType]];
  return fields.join("\n            ");
}
