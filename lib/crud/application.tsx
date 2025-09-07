import { fetchAuthSession } from "aws-amplify/auth";
import {
  AwardType,
  EducationType,
  PastJobType,
  QualificationType,
  ResumeType,
} from "../utils/responseSchemas";
import { generateClient } from "aws-amplify/api";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Types for different associations - updated to match responseSchemas
 */
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
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
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
    console.log(62, itemIds);

    // Build the mutation name based on the associationType
    const mutationName = `create${associationType}Application`;

    // Build the input field name based on the associationType (lowercase first letter)
    const itemIdFieldName = `${
      associationType.charAt(0).toLowerCase() + associationType.slice(1)
    }Id`;

    // STEP 1: Check for existing associations first
    const listQueryName = `list${associationType}Applications`;

    const existingAssociationsQuery = `
      query List${associationType}Applications($filter: Model${associationType}ApplicationFilterInput) {
        ${listQueryName}(filter: $filter) {
          items {
            ${itemIdFieldName}
            applicationId
          }
        }
      }
    `;

    const existingResponse = await client.graphql({
      query: existingAssociationsQuery,
      variables: {
        filter: {
          applicationId: { eq: applicationId },
        },
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

        const response = await client.graphql({
          query: `
            mutation Create${associationType}Application($input: Create${associationType}ApplicationInput!) {
              ${mutationName}(input: $input) {
                ${itemIdFieldName}
                applicationId
              }
            }
          `,
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
          `Failed to create association for ${associationType} ${itemId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // STEP 4: Return results
    if (errors.length > 0 && createdConnections.length === 0) {
      // All failed
      return {
        success: false,
        error: `Failed to create any associations: ${errors.join("; ")}`,
        statusCode: 500,
      };
    } else if (errors.length > 0) {
      // Partial success
      return {
        success: true,
        data: createdConnections,
        statusCode: 207, // Multi-status
        error: `Some associations failed: ${errors.join("; ")}`,
      };
    } else {
      // All successful
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
      error: `Failed to associate ${associationType} with Application: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
};

export const createAndSaveApplication = async ({
  jobId,
  userId,
}: {
  jobId: string;
  userId: string;
}): Promise<ApiResponse> => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
  }

  const client = generateClient();
  try {
    // Validate required parameters
    if (!jobId || !userId) {
      return {
        success: false,
        error: "jobId and userId are required parameters",
        statusCode: 400,
      };
    }

    // Create the Application input object
    const applicationInput = {
      jobId,
      userId,
      // Note: The ID will be auto-generated by Amplify
    };

    // Use the client.models approach in Amplify v2
    const response = await client.graphql({
      query: `
        mutation CreateApplication($input: CreateApplicationInput!) {
          createApplication(input: $input) {
            id
            jobId
            userId
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        input: applicationInput,
      },
      authMode: "userPool",
    });

    // Return the created Application
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
 * Get all associations of a specific type for an application
 *
 * @param {Object} params - The function parameters
 * @param {string} params.applicationId - The ID of the application
 * @param {AssociationType} params.associationType - The type of association to fetch
 * @returns {Promise<ApiResponse<T[]>>} - Array of associated items with duplicates removed
 */
export const getApplicationAssociations = async <T extends AssociationType>({
  applicationId,
  associationType,
}: {
  applicationId: string;
  associationType: T;
}): Promise<ApiResponse<AssociationTypeMap[T][]>> => {
  console.log(337, applicationId, associationType);
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
  }

  const client = generateClient();

  try {
    // Validate required parameters
    if (!applicationId) {
      return {
        success: false,
        error: "applicationId is required",
        statusCode: 400,
      };
    }

    // Build the query name based on the associationType
    const queryName = `list${associationType}Applications`;

    // Build the filter to match the applicationId
    const filter = {
      applicationId: { eq: applicationId },
    };

    // Define the fields to fetch based on the associationType
    const getSpecificFields = () => {
      switch (associationType) {
        case "Award":
          return `
            title
            date
            userId
          `;
        case "Education":
          return `
            degree
            date
            gpa
            major
            school
            schoolCity
            schoolState
            type
            userId
          `;
        case "PastJob":
          return `
            endDate
            hours
            organization
            organizationAddress
            supervisorMayContact
            supervisorName
            supervisorPhone
            type
            qualifications {
              items {
                id
                qualificationId
                qualification {
                  id
                  title
                  description
                  paragraph
                  question
                  topicId
                  userConfirmed
                  userId
                  applications {
                    items {
                      id
                      applicationId
                      qualificationId
                      application {
                        id
                        createdAt
                        updatedAt
                      }
                    }
                  }
                  topic {
                    id
                    title
                    jobId
                    keywords
                    description
                  }
                }
              }
            }
            gsLevel
            responsibilities
            startDate
            title
            userId
          `;
        case "Resume":
          return `
            fileName
            userId
          `;
        case "Qualification":
          return `
            title
            description
            paragraph
            question
            userConfirmed
            topic {
              id
              title
              jobId
              keywords
              description
            }
            pastJob {
              id
              title
              organization
              startDate
              endDate
            }
            userId
          `;
        default:
          return "";
      }
    };

    // Get the composite key field name for this join table
    const getJoinTableKeyFields = () => {
      const itemIdFieldName = `${
        associationType.charAt(0).toLowerCase() + associationType.slice(1)
      }Id`;
      return [itemIdFieldName, "applicationId"];
    };

    const keyFields = getJoinTableKeyFields();

    // Execute the query to get the junction table entries
    const junctionResponse = await client.graphql({
      query: `
        query List${associationType}Applications($filter: Model${associationType}ApplicationFilterInput) {
          ${queryName}(filter: $filter) {
            items {
              ${keyFields.join("\n              ")}
              ${
                associationType.charAt(0).toLowerCase() +
                associationType.slice(1)
              } {
                id
                ${getSpecificFields()}
                createdAt
                updatedAt
              }
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: { filter } as any,
      authMode: "userPool",
    });

    if ("data" in junctionResponse) {
      // Extract associated items
      const junctionItems = junctionResponse.data[queryName].items;
      const associatedItemsWithDuplicates = junctionItems
        .map(
          (item: any) =>
            item[
              associationType.charAt(0).toLowerCase() + associationType.slice(1)
            ]
        )
        .filter(Boolean); // Filter out any null items

      // Deduplicate by ID
      const uniqueItems = deduplicateById(associatedItemsWithDuplicates);

      // Special handling for PastJob to transform the data structure
      if (associationType === "PastJob") {
        const transformedItems = uniqueItems.map((item: any) => {
          // Convert hours to string if it's a number to match schema
          const hours =
            item.hours !== undefined ? String(item.hours) : undefined;

          return {
            ...item,
            hours,
            // Format qualifications as an array matching the schema
            qualifications: (item.qualifications?.items || []).map(
              (qualJunction: any) => {
                // Get the actual qualification from the junction object
                const qual = qualJunction.qualification || {};

                // Debug logging to see what we're getting from GraphQL
                console.log("=== PROCESSING QUALIFICATION FROM DB ===");
                console.log("Raw qual object:", qual);
                console.log("qual.topicId:", qual.topicId);
                console.log("qual.topic:", qual.topic);
                console.log("qual.topic?.id:", qual.topic?.id);

                // Extract topicId - try multiple sources
                let topicId = null;
                if (qual.topicId && qual.topicId !== "") {
                  topicId = qual.topicId;
                } else if (qual.topic?.id && qual.topic.id !== "") {
                  topicId = qual.topic.id;
                }

                // Build topic object only if we have valid data
                let topicData = null;
                if (qual.topic && qual.topic.id && qual.topic.id !== "") {
                  topicData = {
                    id: qual.topic.id,
                    title: qual.topic.title || "",
                    jobId: qual.topic.jobId || "",
                    keywords: Array.isArray(qual.topic.keywords)
                      ? qual.topic.keywords
                      : [],
                    description: qual.topic.description || "",
                  };
                }

                const result = {
                  id: qual.id || qualJunction.id || "",
                  title: qual.title || "",
                  description: qual.description || "",
                  paragraph: qual.paragraph,
                  question: qual.question,
                  userConfirmed: qual.userConfirmed || false,
                  userId: qual.userId || item.userId,
                  topicId: topicId, // This should now preserve the actual topicId
                  applicationIds: (qual.applications?.items || [])
                    .map((appJunction: any) => appJunction.applicationId)
                    .filter(Boolean),
                  topic: topicData, // This will be null if no valid topic, or the proper object
                };

                console.log("Final processed qualification:", result);
                console.log("Final topicId:", result.topicId);
                console.log("Final topic object:", result.topic);

                return result;
              }
            ),
          };
        }) as AssociationTypeMap[T][];

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

export const getApplicationWithJob = async ({
  id,
}: {
  id: string;
}): Promise<ApiResponse> => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
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

    const response = await client.graphql({
      query: `
      query GetApplication($id: ID!) {
        getApplication(id: $id) {
        completedSteps
        id
        jobId
        userId
        job {
          id
          title
          department
          agencyDescription
          duties
          evaluationCriteria
          qualificationsSummary
          questionnaire
          requiredDocuments
          usaJobsId
          topics {
            items {
              id
              keywords
              title
            }
          }
        }
        createdAt
        updatedAt
        }
      }
      `,
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

export const getApplicationWithJobAndQualifications = async ({
  id,
}: {
  id: string;
}): Promise<ApiResponse> => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
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

    const response = await client.graphql({
      query: `
      query GetApplication($id: ID!) {
        getApplication(id: $id) {
          completedSteps
          id
          jobId
          userId
          job {
            id
            title
            department
            agencyDescription
            duties
            evaluationCriteria
            qualificationsSummary
            questionnaire
            requiredDocuments
            usaJobsId
            topics {
              items {
                id
                keywords
                title
              }
            }
          }
          qualifications {
            items {
              qualificationId
              applicationId
              qualification {
                id
                title
                description
                paragraph
                question
                userConfirmed
                userId
                topic {
                  id
                  title
                  keywords
                  description
                }
                pastJobs {
                  items {
                    pastJob {
                      title
                      organization
                    }
                  }
                }
              }
            }
          }
          createdAt
          updatedAt
        }
      }
      `,
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

export const getApplicationWithAllAssociations = async ({
  id,
}: {
  id: string;
}): Promise<ApiResponse> => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
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

    const response = await client.graphql({
      query: `
        query GetApplicationWithAllAssociations($id: ID!) {
          getApplication(id: $id) {
            completedSteps
            id
            jobId
            userId
            job {
              id
              title
              department
              agencyDescription
              duties
              evaluationCriteria
              qualificationsSummary
              questionnaire
              requiredDocuments
              usaJobsId
              topics {
                items {
                  id
                  keywords
                  title
                  description
                }
              }
            }
            # Awards
            awards {
              items {
                award {
                  id
                  title
                  date
                  userId
                  createdAt
                  updatedAt
                }
              }
            }
            # Educations
            educations {
              items {
                education {
                  id
                  degree
                  date
                  gpa
                  major
                  school
                  schoolCity
                  schoolState
                  type
                  userId
                  createdAt
                  updatedAt
                }
              }
            }
            # Past Jobs
            pastJobs {
              items {
                pastJob {
                  id
                  endDate
                  hours
                  organization
                  organizationAddress
                  supervisorMayContact
                  supervisorName
                  supervisorPhone
                  type
                  gsLevel
                  responsibilities
                  startDate
                  title
                  userId
                  qualifications {
                    items {
                      qualification {
                        id
                        title
                        description
                        paragraph
                        question
                        userConfirmed
                        userId
                        topic {
                          id
                          title
                          jobId
                          keywords
                          description
                        }
                      }
                    }
                  }
                  createdAt
                  updatedAt
                }
              }
            }
            # Qualifications
            qualifications {
              items {
                qualification {
                  id
                  title
                  description
                  paragraph
                  question
                  userConfirmed
                  userId
                  topic {
                    id
                    title
                    keywords
                    description
                  }
                  pastJobs {
                    items {
                      pastJob {
                        id
                        title
                        organization
                        startDate
                        endDate
                      }
                    }
                  }
                  createdAt
                  updatedAt
                }
              }
            }
            createdAt
            updatedAt
          }
        }
      `,
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

      // Transform the nested data structure to match your ApplicationType
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
                    (qualJunction: any) => {
                      const qual = qualJunction.qualification || {};
                      return {
                        id: qual.id || "",
                        title: qual.title || "",
                        description: qual.description || "",
                        paragraph: qual.paragraph,
                        question: qual.question,
                        userConfirmed: qual.userConfirmed || false,
                        userId: qual.userId,
                        topic: qual.topic || {
                          id: "",
                          title: "",
                          jobId: "",
                          keywords: [],
                        },
                      };
                    }
                  ),
                };
              })
            )
          : null,
        qualifications: application.qualifications?.items
          ? deduplicateById(
              application.qualifications.items.map(
                (item: any) => item.qualification
              )
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

//tk currently  not used.
export const listApplications = async (): Promise<ApiResponse> => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
  }

  const client = generateClient();
  try {
    const response = await client.graphql({
      query: `
        query ListApplications {
          listApplications {
            items {
              id
              jobId
              userId
              createdAt
              updatedAt
            }
          }
        }
      `,
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

export const listUserApplications = async ({
  userId,
}: {
  userId: string;
}): Promise<ApiResponse> => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
  }

  const client = generateClient();
  try {
    // Validate required parameter
    if (!userId) {
      return {
        success: false,
        error: "userId is required",
        statusCode: 400,
      };
    }

    const response = await client.graphql({
      query: `
        query ListApplications($filter: ModelApplicationFilterInput) {
          listApplications(filter: $filter) {
            items {
              id
              jobId
              userId
              job {
                id
                title
                department
                agencyDescription
              }
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: {
        filter: {
          userId: { eq: userId },
        },
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

export const updateApplication = async ({
  id,
  input,
}: {
  id: string;
  input: {
    completedSteps?: string[];
  };
}): Promise<ApiResponse> => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
  }

  const client = generateClient();

  try {
    // Validate required parameters
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

    const response = await client.graphql({
      query: `
        mutation UpdateApplication($input: UpdateApplicationInput!) {
          updateApplication(input: $input) {
            id
          }
        }
      `,
      variables: {
        input: {
          id,
          ...input,
        },
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
 * Deletes an Application and all its associated join table entries
 * without deleting the actual associated items (Education, Award, etc.)
 *
 * @param {Object} params - The function parameters
 * @param {string} params.applicationId - The ID of the application to delete
 * @returns {Promise<ApiResponse>} - The deleted application data
 */
export const deleteApplication = async ({
  applicationId,
}: {
  applicationId: string;
}): Promise<ApiResponse> => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
  }

  const client = generateClient();

  try {
    // Validate required parameter
    if (!applicationId) {
      return {
        success: false,
        error: "applicationId is required",
        statusCode: 400,
      };
    }

    // Define the composite key field mappings
    const joinTableKeys = {
      AwardApplication: ["awardId", "applicationId"],
      EducationApplication: ["educationId", "applicationId"],
      PastJobApplication: ["pastJobId", "applicationId"],
      QualificationApplication: ["qualificationId", "applicationId"],
    };

    // Define the join tables that need to be cleaned up
    const joinTables = [
      "AwardApplication",
      "EducationApplication",
      "PastJobApplication",
      "QualificationApplication",
    ];

    // Step 1: Delete all join table entries for each association type
    await Promise.all(
      joinTables.map(async (joinTable) => {
        const keyFields =
          joinTableKeys[joinTable as keyof typeof joinTableKeys];
        const [relatedIdField] = keyFields; // First field is the related entity ID

        // 1.1: List all join table entries for this application
        const listQuery = `
          query List${joinTable}s($filter: Model${joinTable}FilterInput) {
            list${joinTable}s(filter: $filter) {
              items {
                ${keyFields.join("\n                ")}
              }
            }
          }
        `;

        const listResponse = await client.graphql({
          query: listQuery,
          variables: {
            filter: {
              applicationId: { eq: applicationId },
            },
          },
          authMode: "userPool",
        });

        if (
          "data" in listResponse &&
          listResponse.data[`list${joinTable}s`]?.items
        ) {
          const joinItems = listResponse.data[`list${joinTable}s`].items;

          // 1.2: Delete each join table entry using composite key
          await Promise.all(
            joinItems.map(async (item: any) => {
              const deleteQuery = `
                mutation Delete${joinTable}($input: Delete${joinTable}Input!) {
                  delete${joinTable}(input: $input) {
                    ${keyFields.join("\n                    ")}
                  }
                }
              `;

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

    // Step 2: Now that all join table entries are deleted, delete the application itself
    const deleteApplicationQuery = `
      mutation DeleteApplication($input: DeleteApplicationInput!) {
        deleteApplication(input: $input) {
          id
          jobId
          userId
          createdAt
          updatedAt
        }
      }
    `;

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
 *
 * @param {Object} params - The function parameters
 * @param {string} params.relatedId - The ID of the related entity (award, education, etc.)
 * @param {string} params.applicationId - The ID of the application
 * @param {string} params.tableName - The name of the join table (e.g., "AwardApplication")
 * @returns {Promise<ApiResponse>} - The deleted join table entry data
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
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      return {
        success: false,
        error: "No valid authentication session found",
        statusCode: 401,
      };
    }
  } catch (error) {
    console.error("No user is signed in");
    return {
      success: false,
      error: "User not authenticated",
      statusCode: 401,
    };
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

    // Define the composite key field mappings
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

    const deleteQuery = `
      mutation Delete${tableName}($input: Delete${tableName}Input!) {
        delete${tableName}(input: $input) {
          ${keyFields.join("\n          ")}
        }
      }
    `;

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
