import { generateClient } from "aws-amplify/api";
import { buildQueryWithFragments } from "./graphqlFragments";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Fetch a single Qualification record with all its applications and jobs
 */
export async function fetchQualificationWithApplicationsAndJobs(
  qualificationId: string
): Promise<ApiResponse<any>> {
  if (
    !qualificationId ||
    typeof qualificationId !== "string" ||
    qualificationId.trim() === ""
  ) {
    return {
      success: false,
      error:
        "Invalid qualificationId: qualificationId must be a non-empty string",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query GetQualification($id: ID!) {
        getQualification(id: $id) {
          ...QualificationFields
          topic {
            ...TopicWithJobFields
            job {
              ...JobDetailedFields
            }
          }
          user {
            ...UserBasicFields
          }
          applications {
            items {
              ...QualificationApplicationFields
              application {
                ...ApplicationWithJobDetailedFields
                job {
                  ...JobDetailedFields
                }
              }
            }
          }
          pastJob {
            id
            title
            organization
            type
            startDate
            endDate
          }
        }
      }
    `);

    const result = await client.graphql({
      query,
      variables: { id: qualificationId },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.getQualification) {
      const qualification = result.data.getQualification;

      // Transform applications data for consistency
      const transformedData = {
        ...qualification,
        applications:
          qualification.applications?.items?.map((item: any) => ({
            id: item.application?.id,
            status: item.application?.status,
            completedSteps: item.application?.completedSteps,
            jobId: item.application?.jobId,
            createdAt: item.application?.createdAt,
            updatedAt: item.application?.updatedAt,
            job: item.application?.job,
            user: item.application?.user,
          })) || [],
        // pastJob is now a direct relationship, not an array
        pastJob: qualification.pastJob || null,
      };

      return {
        success: true,
        data: transformedData,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `Qualification with ID: ${qualificationId} not found`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error(
      "Error fetching Qualification with applications and jobs:",
      error
    );
    return {
      success: false,
      error: `Failed to fetch Qualification with applications and jobs: ${
        error instanceof Error ? error.message : String(error)
      }`,
      statusCode: 500,
    };
  }
}

/**
 * Fetch multiple Qualification records with applications and jobs for a user
 */
export async function fetchUserQualificationsWithApplicationsAndJobs(
  userId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return {
      success: false,
      error: "Invalid userId: userId must be a non-empty string",
      statusCode: 400,
    };
  }

  if (limit <= 0 || limit > 1000) {
    return {
      success: false,
      error: "Invalid limit: limit must be between 1 and 1000",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query ListQualifications($filter: ModelQualificationFilterInput, $limit: Int, $nextToken: String) {
        listQualifications(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ...QualificationFields
            topic {
              ...TopicWithJobFields
            }
            applications {
              items {
                ...QualificationApplicationFields
                application {
                  ...ApplicationWithJobDetailedFields
                  job {
                    ...JobDetailedFields
                  }
                }
              }
            }
            pastJob {
              id
              title
              organization
              type
              startDate
              endDate
            }
          }
          nextToken
        }
      }
    `);

    const result = await client.graphql({
      query,
      variables: {
        filter: { userId: { eq: userId } },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.listQualifications) {
      const { items, nextToken: responseNextToken } =
        result.data.listQualifications;

      // Transform the data for consistency
      const transformedItems =
        items?.map((qualification: any) => ({
          ...qualification,
          applications:
            qualification.applications?.items?.map((item: any) => ({
              id: item.application?.id,
              status: item.application?.status,
              completedSteps: item.application?.completedSteps,
              jobId: item.application?.jobId,
              createdAt: item.application?.createdAt,
              updatedAt: item.application?.updatedAt,
              job: item.application?.job,
              user: item.application?.user,
            })) || [],
          // pastJob is now a direct relationship
          pastJob: qualification.pastJob || null,
        })) || [];

      return {
        success: true,
        data: {
          items: transformedItems,
          nextToken: responseNextToken,
        },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `No Qualifications found for user: ${userId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error(
      "Error fetching user Qualifications with applications and jobs:",
      error
    );
    return {
      success: false,
      error: `Failed to fetch Qualifications for user: ${
        error instanceof Error ? error.message : String(error)
      }`,
      statusCode: 500,
    };
  }
}

/**
 * Fetch qualifications for a specific past job
 */
export async function fetchQualificationsForPastJob(
  pastJobId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  if (!pastJobId || typeof pastJobId !== "string" || pastJobId.trim() === "") {
    return {
      success: false,
      error: "Invalid pastJobId: pastJobId must be a non-empty string",
      statusCode: 400,
    };
  }

  if (limit <= 0 || limit > 1000) {
    return {
      success: false,
      error: "Invalid limit: limit must be between 1 and 1000",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query ListQualifications($filter: ModelQualificationFilterInput, $limit: Int, $nextToken: String) {
        listQualifications(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ...QualificationWithPastJobFields
            applications {
              items {
                ...QualificationApplicationFields
                application {
                  ...ApplicationWithJobFields
                }
              }
            }
          }
          nextToken
        }
      }
    `);

    const result = await client.graphql({
      query,
      variables: {
        filter: { pastJobId: { eq: pastJobId } },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.listQualifications) {
      const { items, nextToken: responseNextToken } =
        result.data.listQualifications;

      // Transform applications data
      const transformedItems =
        items?.map((qualification: any) => ({
          ...qualification,
          applications:
            qualification.applications?.items?.map((item: any) => ({
              id: item.application?.id,
              status: item.application?.status,
              completedSteps: item.application?.completedSteps,
              jobId: item.application?.jobId,
              job: item.application?.job,
              user: item.application?.user,
            })) || [],
        })) || [];

      return {
        success: true,
        data: {
          items: transformedItems,
          nextToken: responseNextToken,
        },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `No Qualifications found for pastJob: ${pastJobId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error("Error fetching Qualifications for past job:", error);
    return {
      success: false,
      error: `Failed to fetch Qualifications for past job: ${
        error instanceof Error ? error.message : String(error)
      }`,
      statusCode: 500,
    };
  }
}

/**
 * Fetch qualifications for a specific topic
 */
export async function fetchQualificationsForTopic(
  topicId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  if (!topicId || typeof topicId !== "string" || topicId.trim() === "") {
    return {
      success: false,
      error: "Invalid topicId: topicId must be a non-empty string",
      statusCode: 400,
    };
  }

  if (limit <= 0 || limit > 1000) {
    return {
      success: false,
      error: "Invalid limit: limit must be between 1 and 1000",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const query = buildQueryWithFragments(`
      query ListQualifications($filter: ModelQualificationFilterInput, $limit: Int, $nextToken: String) {
        listQualifications(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            ...QualificationWithTopicFields
            pastJob {
              id
              title
              organization
              startDate
              endDate
            }
            applications {
              items {
                ...QualificationApplicationFields
                application {
                  ...ApplicationWithJobFields
                }
              }
            }
          }
          nextToken
        }
      }
    `);

    const result = await client.graphql({
      query,
      variables: {
        filter: { topicId: { eq: topicId } },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.listQualifications) {
      const { items, nextToken: responseNextToken } =
        result.data.listQualifications;

      // Transform applications data
      const transformedItems =
        items?.map((qualification: any) => ({
          ...qualification,
          applications:
            qualification.applications?.items?.map((item: any) => ({
              id: item.application?.id,
              status: item.application?.status,
              completedSteps: item.application?.completedSteps,
              jobId: item.application?.jobId,
              job: item.application?.job,
              user: item.application?.user,
            })) || [],
        })) || [];

      return {
        success: true,
        data: {
          items: transformedItems,
          nextToken: responseNextToken,
        },
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: `No Qualifications found for topic: ${topicId}`,
        statusCode: 404,
      };
    }
  } catch (error) {
    console.error("Error fetching Qualifications for topic:", error);
    return {
      success: false,
      error: `Failed to fetch Qualifications for topic: ${
        error instanceof Error ? error.message : String(error)
      }`,
      statusCode: 500,
    };
  }
}

/**
 * Create a new qualification
 */
export async function createQualification(qualificationData: {
  title: string;
  description: string;
  paragraph?: string;
  question?: string;
  userConfirmed?: boolean;
  topicId: string;
  userId: string;
  pastJobId?: string;
}): Promise<ApiResponse<any>> {
  if (
    !qualificationData.title ||
    !qualificationData.description ||
    !qualificationData.topicId ||
    !qualificationData.userId
  ) {
    return {
      success: false,
      error:
        "Missing required fields: title, description, topicId, and userId are required",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const mutation = buildQueryWithFragments(`
      mutation CreateQualification($input: CreateQualificationInput!) {
        createQualification(input: $input) {
          ...QualificationWithTopicFields
        }
      }
    `);

    const result = await client.graphql({
      query: mutation,
      variables: {
        input: {
          title: qualificationData.title,
          description: qualificationData.description,
          paragraph: qualificationData.paragraph || "",
          question: qualificationData.question || "",
          userConfirmed: qualificationData.userConfirmed || false,
          topicId: qualificationData.topicId,
          userId: qualificationData.userId,
          pastJobId: qualificationData.pastJobId,
        },
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.createQualification) {
      return {
        success: true,
        data: result.data.createQualification,
        statusCode: 201,
      };
    } else {
      return {
        success: false,
        error: "Unexpected response format from GraphQL operation",
        statusCode: 500,
      };
    }
  } catch (error) {
    console.error("Error creating Qualification:", error);
    return {
      success: false,
      error: `Failed to create Qualification: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Update an existing qualification
 */
export async function updateQualification(
  qualificationId: string,
  updates: {
    title?: string;
    description?: string;
    paragraph?: string;
    question?: string;
    userConfirmed?: boolean;
    topicId?: string;
    pastJobId?: string;
  }
): Promise<ApiResponse<any>> {
  if (
    !qualificationId ||
    typeof qualificationId !== "string" ||
    qualificationId.trim() === ""
  ) {
    return {
      success: false,
      error:
        "Invalid qualificationId: qualificationId must be a non-empty string",
      statusCode: 400,
    };
  }

  if (!updates || Object.keys(updates).length === 0) {
    return {
      success: false,
      error: "At least one field to update is required",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const mutation = buildQueryWithFragments(`
      mutation UpdateQualification($input: UpdateQualificationInput!) {
        updateQualification(input: $input) {
          ...QualificationWithTopicFields
        }
      }
    `);

    const result = await client.graphql({
      query: mutation,
      variables: {
        input: {
          id: qualificationId,
          ...updates,
        },
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.updateQualification) {
      return {
        success: true,
        data: result.data.updateQualification,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: "Unexpected response format from GraphQL operation",
        statusCode: 500,
      };
    }
  } catch (error) {
    console.error("Error updating Qualification:", error);
    return {
      success: false,
      error: `Failed to update Qualification: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Delete a qualification
 */
export async function deleteQualification(
  qualificationId: string
): Promise<ApiResponse<any>> {
  if (
    !qualificationId ||
    typeof qualificationId !== "string" ||
    qualificationId.trim() === ""
  ) {
    return {
      success: false,
      error:
        "Invalid qualificationId: qualificationId must be a non-empty string",
      statusCode: 400,
    };
  }

  const client = generateClient();

  try {
    const mutation = buildQueryWithFragments(`
      mutation DeleteQualification($input: DeleteQualificationInput!) {
        deleteQualification(input: $input) {
          ...QualificationFields
        }
      }
    `);

    const result = await client.graphql({
      query: mutation,
      variables: {
        input: { id: qualificationId },
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.deleteQualification) {
      return {
        success: true,
        data: result.data.deleteQualification,
        statusCode: 200,
      };
    } else {
      return {
        success: false,
        error: "Unexpected response format from GraphQL operation",
        statusCode: 500,
      };
    }
  } catch (error) {
    console.error("Error deleting Qualification:", error);
    return {
      success: false,
      error: `Failed to delete Qualification: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}
