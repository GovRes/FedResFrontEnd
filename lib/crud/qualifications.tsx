import { generateClient } from "aws-amplify/api";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Fetch a single Qualification record with all its applications and the jobs those applications are for
 *
 * @param {string} qualificationId - The ID of the Qualification to fetch
 * @returns {Promise<ApiResponse<Object>>} - API response with the Qualification data including applications and jobs
 */
export async function fetchQualificationWithApplicationsAndJobs(
  qualificationId: string
): Promise<ApiResponse<any>> {
  // Validate input
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
    const getQualificationQuery = `
      query GetQualification($id: ID!) {
        getQualification(id: $id) {
          id
          title
          description
          paragraph
          question
          userConfirmed
          topicId
          userId
          createdAt
          updatedAt
          topic {
            id
            title
            keywords
            description
            evidence
            jobId
            job {
              id
              title
              department
              usaJobsId
              agencyDescription
              duties
              evaluationCriteria
              qualificationsSummary
            }
          }
          user {
            id
            email
            givenName
            familyName
          }
          applications {
            items {
              id
              qualificationId
              applicationId
              application {
                id
                status
                completedSteps
                jobId
                createdAt
                updatedAt
                job {
                  id
                  title
                  department
                  usaJobsId
                  agencyDescription
                  duties
                  evaluationCriteria
                  qualificationsSummary
                }
                user {
                  id
                  email
                  givenName
                  familyName
                }
              }
            }
          }
          pastJobs {
            items {
              id
              pastJobId
              qualificationId
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
        }
      }
    `;

    const result = await client.graphql({
      query: getQualificationQuery,
      variables: {
        id: qualificationId,
      },
      authMode: "userPool",
    });

    // Check if the result is a GraphQLResult type with data
    if ("data" in result && result.data?.getQualification) {
      const qualification = result.data.getQualification;

      // Transform the data to a more convenient format
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
        pastJobs:
          qualification.pastJobs?.items?.map((item: any) => ({
            id: item.pastJob?.id,
            title: item.pastJob?.title,
            organization: item.pastJob?.organization,
            type: item.pastJob?.type,
            startDate: item.pastJob?.startDate,
            endDate: item.pastJob?.endDate,
          })) || [],
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
      error: `Failed to fetch Qualification with applications and jobs: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Fetch multiple Qualification records with their applications and jobs for a specific user
 *
 * @param {string} userId - The ID of the user whose Qualifications to fetch
 * @param {number} limit - Optional limit on the number of results (default: 100)
 * @param {string} nextToken - Optional pagination token for fetching next page
 * @returns {Promise<ApiResponse<{items: Object[], nextToken?: string}>>} - API response with array of Qualification data
 */
export async function fetchUserQualificationsWithApplicationsAndJobs(
  userId: string,
  limit: number = 100,
  nextToken?: string
): Promise<ApiResponse<{ items: any[]; nextToken?: string }>> {
  // Validate input
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
    const listQualificationsQuery = `
      query ListQualifications($filter: ModelQualificationFilterInput, $limit: Int, $nextToken: String) {
        listQualifications(filter: $filter, limit: $limit, nextToken: $nextToken) {
          items {
            id
            title
            description
            paragraph
            question
            userConfirmed
            topicId
            userId
            createdAt
            updatedAt
            topic {
              id
              title
              keywords
              description
              evidence
              jobId
              job {
                id
                title
                department
                usaJobsId
              }
            }
            applications {
              items {
                id
                qualificationId
                applicationId
                application {
                  id
                  status
                  completedSteps
                  jobId
                  createdAt
                  updatedAt
                  job {
                    id
                    title
                    department
                    usaJobsId
                    agencyDescription
                  }
                  user {
                    id
                    email
                    givenName
                    familyName
                  }
                }
              }
            }
            pastJobs {
              items {
                id
                pastJobId
                qualificationId
                pastJob {
                  id
                  title
                  organization
                  type
                }
              }
            }
          }
          nextToken
        }
      }
    `;

    const result = await client.graphql({
      query: listQualificationsQuery,
      variables: {
        filter: {
          userId: { eq: userId },
        },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    if ("data" in result && result.data?.listQualifications) {
      const { items, nextToken: responseNextToken } =
        result.data.listQualifications;

      // Transform the data to a more convenient format
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
          pastJobs:
            qualification.pastJobs?.items?.map((item: any) => ({
              id: item.pastJob?.id,
              title: item.pastJob?.title,
              organization: item.pastJob?.organization,
              type: item.pastJob?.type,
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
      error: `Failed to fetch Qualifications for user: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 500,
    };
  }
}

/**
 * Example usage:
 *
 * // Fetch single Qualification with applications and jobs
 * const fetchResult = await fetchQualificationWithApplicationsAndJobs("qualification123");
 * if (fetchResult.success && fetchResult.data) {
 *   console.log("Qualification with applications:", fetchResult.data);
 *   console.log("Number of applications:", fetchResult.data.applications.length);
 *
 *   // Access job information from applications
 *   fetchResult.data.applications.forEach((app: any) => {
 *     console.log(`Application ${app.id} for job: ${app.job?.title} at ${app.job?.department}`);
 *   });
 * } else {
 *   console.error(`Error ${fetchResult.statusCode}:`, fetchResult.error);
 * }
 *
 * // Fetch all Qualifications for a user with their applications and jobs
 * const userQualificationsResult = await fetchUserQualificationsWithApplicationsAndJobs("user123", 50);
 * if (userQualificationsResult.success && userQualificationsResult.data) {
 *   console.log(`Found ${userQualificationsResult.data.items.length} qualifications`);
 *
 *   userQualificationsResult.data.items.forEach((qual: any) => {
 *     console.log(`Qualification: ${qual.title}`);
 *     qual.applications.forEach((app: any) => {
 *       console.log(`  - Applied to: ${app.job?.title} (${app.status})`);
 *     });
 *   });
 *
 *   if (userQualificationsResult.data.nextToken) {
 *     console.log("More results available, use nextToken for pagination");
 *   }
 * }
 */
