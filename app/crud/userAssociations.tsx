import { generateClient } from "aws-amplify/api";

/**
 * The supported entity types that can be fetched for a user
 */
export type AssociationType =
  | "Award"
  | "Education"
  // | "Resume"
  | "SpecializedExperience"
  | "PastJob"
  | "Volunteer"
  | "PastJobQualification";

/**
 * Generic type for entity records
 */
export type EntityRecord = {
  id: string;
  userId: string;
  [key: string]: any;
};

/**
 * Fetches all associations of a specific type for the logged-in user.
 *
 * @param {AssociationType} associationType - The type of association to fetch
 * @param {number} limit - Maximum number of records to fetch (default: 1000)
 * @returns {Promise<EntityRecord[]>} - Array of association objects belonging to the logged-in user
 */
export async function fetchUserAssociations<T extends EntityRecord>(
  associationType: AssociationType,
  limit: number = 1000
): Promise<T[]> {
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
      return result.data[queryName].items as T[];
    } else {
      return [] as T[];
    }
  } catch (error) {
    console.error(`Error fetching user ${associationType}s:`, error);
    throw error;
  }
}

/**
 * Checks if an entity already exists and creates it if it doesn't.
 *
 * @param {AssociationType} associationType - The type of association to create
 * @param {Object} inputData - The data for the new entity
 * @param {Object} identifierFields - The fields to use for checking if the entity exists
 * @param {string} userId - The user ID to associate with the new entity
 * @returns {Promise<EntityRecord>} - The existing or newly created entity
 */
export async function createIfNotExists<T extends EntityRecord>(
  associationType: AssociationType,
  inputData: Omit<T, "id" | "createdAt" | "updatedAt">,
  identifierFields: string[],
  userId: string
): Promise<T> {
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
      return existingResult.data[listQueryName].items[0] as T;
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
      return createResult.data[createQueryName] as T;
    } else {
      throw new Error(`Failed to create ${associationType}`);
    }
  } catch (error) {
    console.error(`Error in createIfNotExists for ${associationType}:`, error);
    throw error;
  }
}

/**
 * Creates and saves multiple entities of a specific type, checking if each one already exists.
 *
 * @param {AssociationType} associationType - The type of association to create
 * @param {Object[]} entitiesInput - Array of entity data objects
 * @param {string[]} identifierFields - Fields to use for checking if entities exist
 * @param {string} userId - The user ID to associate with new entities
 * @returns {Promise<Object[]>} - The array of existing or newly created entities
 */
export async function createAndSaveEntities<T extends EntityRecord>(
  associationType: AssociationType,
  entitiesInput: Omit<T, "id" | "createdAt" | "updatedAt">[],
  identifierFields: string[],
  userId: string
): Promise<T[]> {
  const results: T[] = [];

  // Process each entity in the input array
  for (const entityInput of entitiesInput) {
    const result = await createIfNotExists<T>(
      associationType,
      entityInput,
      identifierFields,
      userId
    );

    results.push(result);
  }

  return results;
}

/**
 * Creates a relationship between two entities using the appropriate join table.
 *
 * @param parentType - The type of the parent entity
 * @param parentId - The ID of the parent entity
 * @param childType - The type of the child entity
 * @param childId - The ID of the child entity
 */
export async function createRelationship(
  parentType: AssociationType,
  parentId: string,
  childType: AssociationType,
  childId: string
): Promise<void> {
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
    await client.graphql({
      query: createRelationshipMutation,
      variables: {
        input: {
          [parentIdField]: parentId,
          [childIdField]: childId,
        },
      },
      authMode: "userPool",
    });
  } catch (error) {
    console.error(
      `Error creating relationship between ${parentType} and ${childType}:`,
      error
    );
    throw error;
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
    Education: [
      "degree",
      "major",
      "school",
      "date",
      "title",
      "gpa",
      "userConfirmed",
    ],
    // Resume: ["fileName"],
    SpecializedExperience: [
      "title",
      "description",
      "userConfirmed",
      "paragraph",
      "initialMessage",
    ],
    PastJob: [
      "title",
      "organization",
      "startDate",
      "endDate",
      "hours",
      "gsLevel",
      "responsibilities",
    ],
    Volunteer: [
      "title",
      "organization",
      "startDate",
      "endDate",
      "hours",
      "gsLevel",
      "responsibilities",
    ],
    PastJobQualification: [
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
