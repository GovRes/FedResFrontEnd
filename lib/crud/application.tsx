import { fetchAuthSession } from "aws-amplify/auth";
import {
  AwardType,
  EducationType,
  PastJobType,
  QualificationType,
  ResumeType,
} from "../utils/responseSchemas";
import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

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

/**
 * Helper function to validate authentication
 */
async function validateAuth(): Promise<{
  success: boolean;
  error?: string;
  statusCode?: number;
}> {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
    return { success: true };
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
  }
}

/**
 * Helper function to deduplicate items by ID
 */
function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

/**
 * Associate items with an application
 */
export const associateItemsWithApplication = async ({
  applicationId,
  items,
  associationType,
}: {
  applicationId: string;
  items: { id: string }[] | string[];
  associationType: AssociationType;
}): Promise<ApiResponse> => {
  console.log(items, associationType);

  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    // Validate required parameters
    if (!applicationId || !items || items.length === 0) {
      return {
        success: false,
        error: `applicationId and non-empty ${associationType} items array are required`,
        statusCode: 400,
      };
    }

    // Map to get the item IDs whether we received objects with IDs or just ID strings
    const itemIds = items.map((item) =>
      typeof item === "string" ? item : item.id
    );

    // Build the mutation name and field names based on the associationType
    const mutationName = `create${associationType}Application`;
    const itemIdFieldName = `${associationType.charAt(0).toLowerCase() + associationType.slice(1)}Id`;
    const listQueryName = `list${associationType}Applications`;

    // STEP 1: Check for existing associations
    const existingAssociationsQuery = buildQueryWithFragments(`
      query List${associationType}Applications($filter: Model${associationType}ApplicationFilterInput) {
        ${listQueryName}(filter: $filter) {
          items {
            ${itemIdFieldName}
            applicationId
          }
        }
      }
    `);

    const existingResponse = await client.graphql({
      query: existingAssociationsQuery,
      variables: {
        filter: { applicationId: { eq: applicationId } },
      },
      authMode: "userPool",
    });

    // Get existing item IDs that are already associated
    const existingItemIds = new Set();
    if (
      "data" in existingResponse &&
      existingResponse.data[listQueryName]?.items
    ) {
      existingResponse.data[listQueryName].items.forEach((item: any) => {
        existingItemIds.add(item[itemIdFieldName]);
      });
    }

    // STEP 2: Filter out items that are already associated
    const newItemIds = itemIds.filter((itemId) => !existingItemIds.has(itemId));

    if (newItemIds.length === 0) {
      console.log(
        `All ${associationType} items are already associated with this application`
      );
      return {
        success: true,
        data: [],
        statusCode: 200,
      };
    }

    console.log(
      `Creating ${newItemIds.length} new associations out of ${itemIds.length} total items`
    );

    // STEP 3: Create connections for new items only
    const createdConnections = [];
    const errors = [];

    for (const itemId of newItemIds) {
      try {
        const input = {
          [itemIdFieldName]: itemId,
          applicationId,
        };

        const createMutation = buildQueryWithFragments(`
          mutation Create${associationType}Application($input: Create${associationType}ApplicationInput!) {
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
          createdConnections.push(response.data[mutationName]);
          console.log(
            `Successfully created association for ${associationType} ${itemId}`
          );
        } else {
          errors.push(
            `Failed to create association for ${associationType} ${itemId}: Unexpected response format`
          );
        }
      } catch (error) {
        console.error(
          `Error creating association for ${associationType} ${itemId}:`,
          error
        );
        errors.push(
          `Failed to create association for ${associationType} ${itemId}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // STEP 4: Return results
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
        statusCode: 207, // Multi-status
        error: `Some associations failed: ${errors.join("; ")}`,
      };
    } else {
      return {
        success: true,
        data: createdConnections,
        statusCode: 201,
      };
    }
  } catch (error) {
    console.error(
      `Error associating ${associationType} with Application:`,
      error
    );
    return {
      success: false,
      error: `Failed to associate ${associationType} with Application: ${
        error instanceof Error ? error.message : String(error)
      }`,
      statusCode: 500,
    };
  }
};

/**
 * Create and save a new application
 */
export const createAndSaveApplication = async ({
  jobId,
  userId,
}: {
  jobId: string;
  userId: string;
}): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!jobId || !userId) {
      return {
        success: false,
        error: "jobId and userId are required parameters",
        statusCode: 400,
      };
    }

    const createMutation = buildQueryWithFragments(`
      mutation CreateApplication($input: CreateApplicationInput!) {
        createApplication(input: $input) {
          ...ApplicationFields
        }
      }
    `);

    const response = await client.graphql({
      query: createMutation,
      variables: {
        input: { jobId, userId },
      },
      authMode: "userPool",
    });

    if ("data" in response) {
      return {
        success: true,
        data: response.data.createApplication,
        statusCode: 201,
      };
    }

    return {
      success: false,
      error: "Unexpected response format from GraphQL operation",
      statusCode: 500,
    };
  } catch (error) {
    console.error("Error creating Application:", error);
    return {
      success: false,
      error: "Failed to create Application",
      statusCode: 500,
    };
  }
};

/**
 * Get all associations of a specific type for an application
 */
export const getApplicationAssociations = async <T extends AssociationType>({
  applicationId,
  associationType,
}: {
  applicationId: string;
  associationType: T;
}): Promise<ApiResponse<AssociationTypeMap[T][]>> => {
  console.log(337, applicationId, associationType);

  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!applicationId) {
      return {
        success: false,
        error: "applicationId is required",
        statusCode: 400,
      };
    }

    const queryName = `list${associationType}Applications`;
    const entityFieldName = `${associationType.charAt(0).toLowerCase() + associationType.slice(1)}`;

    // Build query with appropriate fragments based on association type
    const getQueryForAssociationType = () => {
      switch (associationType) {
        case "Award":
          return buildQueryWithFragments(`
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
          `);
        case "Education":
          return buildQueryWithFragments(`
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
          `);
        case "PastJob":
          return buildQueryWithFragments(`
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
          `);
        case "Qualification":
          return buildQueryWithFragments(`
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
          `);
        case "Resume":
          return buildQueryWithFragments(`
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
          `);
        default:
          return "";
      }
    };

    const query = getQueryForAssociationType();

    const junctionResponse = await client.graphql({
      query,
      variables: {
        filter: { applicationId: { eq: applicationId } },
      } as any,
      authMode: "userPool",
    });

    if ("data" in junctionResponse) {
      const junctionItems = junctionResponse.data[queryName].items;
      const associatedItemsWithDuplicates = junctionItems
        .map((item: any) => item[entityFieldName])
        .filter(Boolean);

      const uniqueItems = deduplicateById(associatedItemsWithDuplicates);

      // Special handling for PastJob to transform qualifications
      if (associationType === "PastJob") {
        const transformedItems = uniqueItems.map((item: any) => {
          const hours =
            item.hours !== undefined ? String(item.hours) : undefined;
          return {
            ...item,
            hours,
            qualifications: (item.qualifications?.items || []).map(
              (qualification: any) => ({
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
              })
            ),
          };
        }) as AssociationTypeMap[T][];

        return {
          success: true,
          data: transformedItems,
          statusCode: 200,
        };
      }

      // For Qualification, handle the simplified pastJob relationship
      if (associationType === "Qualification") {
        const transformedItems = uniqueItems.map((item: any) => ({
          ...item,
          pastJob: item.pastJob || null,
          topic: item.topic || null,
        })) as AssociationTypeMap[T][];

        return {
          success: true,
          data: transformedItems,
          statusCode: 200,
        };
      }

      return {
        success: true,
        data: uniqueItems as AssociationTypeMap[T][],
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: `Unexpected response format from GraphQL operation for ${associationType}`,
      statusCode: 500,
    };
  } catch (error) {
    console.error(
      `Error fetching ${associationType} associations for Application:`,
      error
    );
    return {
      success: false,
      error: `Failed to fetch ${associationType} associations for Application`,
      statusCode: 500,
    };
  }
};

/**
 * Get application with job details
 */
export const getApplicationWithJob = async ({
  id,
}: {
  id: string;
}): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!id) {
      return {
        success: false,
        error: "Application id is required",
        statusCode: 400,
      };
    }

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

    const response = await client.graphql({
      query,
      variables: { id },
      authMode: "userPool",
    });

    if ("data" in response) {
      const application = response.data.getApplication;

      if (!application) {
        return {
          success: false,
          error: `Application with id: ${id} not found`,
          statusCode: 404,
        };
      }

      // Flatten the topics.items array if it exists
      if (application?.job?.topics?.items) {
        application.job.topics = application.job.topics.items;
      }

      return {
        success: true,
        data: application,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: "Unexpected response format from GraphQL operation",
      statusCode: 500,
    };
  } catch (error) {
    console.error("Error fetching Application:", error);
    return {
      success: false,
      error: "Failed to fetch Application",
      statusCode: 500,
    };
  }
};

/**
 * Get application with job details and qualifications
 */
export const getApplicationWithJobAndQualifications = async ({
  id,
}: {
  id: string;
}): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!id) {
      return {
        success: false,
        error: "Application id is required",
        statusCode: 400,
      };
    }

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

    const response = await client.graphql({
      query,
      variables: { id },
      authMode: "userPool",
    });

    if ("data" in response) {
      const application = response.data.getApplication;

      if (!application) {
        return {
          success: false,
          error: `Application with id: ${id} not found`,
          statusCode: 404,
        };
      }

      // Flatten the topics.items array
      if (application?.job?.topics?.items) {
        application.job.topics = application.job.topics.items;
      }

      return {
        success: true,
        data: application,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: "Unexpected response format from GraphQL operation",
      statusCode: 500,
    };
  } catch (error) {
    console.error("Error fetching Application:", error);
    return {
      success: false,
      error: "Failed to fetch Application",
      statusCode: 500,
    };
  }
};

/**
 * Get application with all associations
 */
export const getApplicationWithAllAssociations = async ({
  id,
}: {
  id: string;
}): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!id) {
      return {
        success: false,
        error: "Application id is required",
        statusCode: 400,
      };
    }

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

    const response = await client.graphql({
      query,
      variables: { id },
      authMode: "userPool",
    });

    if ("data" in response) {
      const application = response.data.getApplication;

      if (!application) {
        return {
          success: false,
          error: `Application with id: ${id} not found`,
          statusCode: 404,
        };
      }

      // Transform the nested data structure
      const transformedApplication = {
        ...application,
        job: {
          ...application.job,
          topics: application.job?.topics?.items || null,
        },
        // Transform each association type
        awards: application.awards?.items
          ? deduplicateById(
              application.awards.items.map((item: any) => item.award)
            )
          : null,
        educations: application.educations?.items
          ? deduplicateById(
              application.educations.items.map((item: any) => item.education)
            )
          : null,
        pastJobs: application.pastJobs?.items
          ? deduplicateById(
              application.pastJobs.items.map((item: any) => {
                const pastJob = item.pastJob;
                return {
                  ...pastJob,
                  hours:
                    pastJob.hours !== undefined
                      ? String(pastJob.hours)
                      : undefined,
                  qualifications: (pastJob.qualifications?.items || []).map(
                    (qualification: any) => ({
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
                    })
                  ),
                };
              })
            )
          : null,
        qualifications: application.qualifications?.items
          ? deduplicateById(
              application.qualifications.items.map((item: any) => {
                const qual = item.qualification;
                return {
                  ...qual,
                  pastJob: qual.pastJob || null,
                };
              })
            ).sort((a: QualificationType, b: QualificationType) => {
              if (a.id < b.id) return -1;
              return 1;
            })
          : null,
        resumes: application.resumes?.items
          ? deduplicateById(
              application.resumes.items.map((item: any) => item.resume)
            )
          : null,
      };

      return {
        success: true,
        data: transformedApplication,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: "Unexpected response format from GraphQL operation",
      statusCode: 500,
    };
  } catch (error) {
    console.error("Error fetching Application with all associations:", error);
    return {
      success: false,
      error: "Failed to fetch Application with all associations",
      statusCode: 500,
    };
  }
};

/**
 * List all applications
 */
export const listApplications = async (): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query ListApplications {
        listApplications {
          items {
            ...ApplicationFields
          }
        }
      }
    `);

    const response = await client.graphql({
      query,
      authMode: "userPool",
    });

    if ("data" in response) {
      return {
        success: true,
        data: response.data.listApplications.items,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: "Unexpected response format from GraphQL operation",
      statusCode: 500,
    };
  } catch (error) {
    console.error("Error fetching Applications:", error);
    return {
      success: false,
      error: "Failed to fetch Applications",
      statusCode: 500,
    };
  }
};

/**
 * List applications for a specific user
 */
export const listUserApplications = async ({
  userId,
}: {
  userId: string;
}): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!userId) {
      return {
        success: false,
        error: "userId is required",
        statusCode: 400,
      };
    }

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

    const response = await client.graphql({
      query,
      variables: {
        filter: { userId: { eq: userId } },
      },
      authMode: "userPool",
    });

    if ("data" in response) {
      return {
        success: true,
        data: response.data.listApplications.items,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: "Unexpected response format from GraphQL operation",
      statusCode: 500,
    };
  } catch (error) {
    console.error("Error fetching user Applications:", error);
    return {
      success: false,
      error: "Failed to fetch user Applications",
      statusCode: 500,
    };
  }
};

/**
 * Update an application
 */
export const updateApplication = async ({
  id,
  input,
}: {
  id: string;
  input: {
    completedSteps?: string[];
    status?: string;
  };
}): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!id) {
      return {
        success: false,
        error: "Application id is required",
        statusCode: 400,
      };
    }

    if (Object.keys(input).length === 0) {
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

    const response = await client.graphql({
      query: mutation,
      variables: {
        input: { id, ...input },
      },
      authMode: "userPool",
    });

    if ("data" in response) {
      return {
        success: true,
        data: response.data.updateApplication,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: "Unexpected response format from GraphQL operation",
      statusCode: 500,
    };
  } catch (error) {
    console.error("Error updating Application:", error);
    return {
      success: false,
      error: "Failed to update Application",
      statusCode: 500,
    };
  }
};

/**
 * Delete an application and all its associated join table entries
 */
export const deleteApplication = async ({
  applicationId,
}: {
  applicationId: string;
}): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!applicationId) {
      return {
        success: false,
        error: "applicationId is required",
        statusCode: 400,
      };
    }

    // Define the join tables that need to be cleaned up
    const joinTables = [
      "AwardApplication",
      "EducationApplication",
      "PastJobApplication",
      "QualificationApplication",
    ];

    const joinTableKeys = {
      AwardApplication: ["awardId", "applicationId"],
      EducationApplication: ["educationId", "applicationId"],
      PastJobApplication: ["pastJobId", "applicationId"],
      QualificationApplication: ["qualificationId", "applicationId"],
    };

    // Step 1: Delete all join table entries for each association type
    await Promise.all(
      joinTables.map(async (joinTable) => {
        const keyFields =
          joinTableKeys[joinTable as keyof typeof joinTableKeys];
        const [relatedIdField] = keyFields;

        // List all join table entries for this application
        const listQuery = buildQueryWithFragments(`
          query List${joinTable}s($filter: Model${joinTable}FilterInput) {
            list${joinTable}s(filter: $filter) {
              items {
                ${keyFields.join("\n                ")}
              }
            }
          }
        `);

        const listResponse = await client.graphql({
          query: listQuery,
          variables: {
            filter: { applicationId: { eq: applicationId } },
          },
          authMode: "userPool",
        });

        if (
          "data" in listResponse &&
          listResponse.data[`list${joinTable}s`]?.items
        ) {
          const joinItems = listResponse.data[`list${joinTable}s`].items;

          // Delete each join table entry using composite key
          await Promise.all(
            joinItems.map(async (item: any) => {
              const deleteQuery = buildQueryWithFragments(`
                mutation Delete${joinTable}($input: Delete${joinTable}Input!) {
                  delete${joinTable}(input: $input) {
                    ${keyFields.join("\n                    ")}
                  }
                }
              `);

              return client.graphql({
                query: deleteQuery,
                variables: {
                  input: {
                    [relatedIdField]: item[relatedIdField],
                    applicationId: item.applicationId,
                  },
                },
                authMode: "userPool",
              });
            })
          );
        }
      })
    );

    // Step 2: Delete the application itself
    const deleteApplicationQuery = buildQueryWithFragments(`
      mutation DeleteApplication($input: DeleteApplicationInput!) {
        deleteApplication(input: $input) {
          ...ApplicationFields
        }
      }
    `);

    const deleteResponse = await client.graphql({
      query: deleteApplicationQuery,
      variables: {
        input: { id: applicationId },
      },
      authMode: "userPool",
    });

    if ("data" in deleteResponse) {
      return {
        success: true,
        data: deleteResponse.data.deleteApplication,
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: "Unexpected response format from GraphQL operation",
      statusCode: 500,
    };
  } catch (error) {
    console.error("Error deleting Application:", error);
    return {
      success: false,
      error: "Failed to delete Application",
      statusCode: 500,
    };
  }
};

/**
 * Helper function to delete a single item from a join table using composite keys
 */
export const deleteJoinTableItem = async ({
  relatedId,
  applicationId,
  tableName,
}: {
  relatedId: string;
  applicationId: string;
  tableName: string;
}): Promise<ApiResponse> => {
  const authCheck = await validateAuth();
  if (!authCheck.success) {
    return authCheck as ApiResponse;
  }

  const client = generateClient();

  try {
    if (!relatedId || !applicationId || !tableName) {
      return {
        success: false,
        error: "relatedId, applicationId, and tableName are required",
        statusCode: 400,
      };
    }

    const joinTableKeys = {
      AwardApplication: ["awardId", "applicationId"],
      EducationApplication: ["educationId", "applicationId"],
      PastJobApplication: ["pastJobId", "applicationId"],
      QualificationApplication: ["qualificationId", "applicationId"],
    };

    const keyFields = joinTableKeys[tableName as keyof typeof joinTableKeys];
    if (!keyFields) {
      return {
        success: false,
        error: `Unknown table name: ${tableName}`,
        statusCode: 400,
      };
    }

    const [relatedIdField] = keyFields;

    const deleteQuery = buildQueryWithFragments(`
      mutation Delete${tableName}($input: Delete${tableName}Input!) {
        delete${tableName}(input: $input) {
          ${keyFields.join("\n          ")}
        }
      }
    `);

    const response = await client.graphql({
      query: deleteQuery,
      variables: {
        input: {
          [relatedIdField]: relatedId,
          applicationId: applicationId,
        },
      },
      authMode: "userPool",
    });

    if ("data" in response) {
      return {
        success: true,
        data: response.data[`delete${tableName}`],
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: `Unexpected response format from GraphQL operation when deleting ${tableName}`,
      statusCode: 500,
    };
  } catch (error) {
    console.error(`Error deleting ${tableName}:`, error);
    return {
      success: false,
      error: `Failed to delete ${tableName}`,
      statusCode: 500,
    };
  }
};
