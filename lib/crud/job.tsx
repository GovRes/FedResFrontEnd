import { generateClient } from "aws-amplify/api";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Retrieves a job by its usaJobsId
 *
 * @param {string} usaJobsId - The usaJobsId to search for
 * @returns {Promise<ApiResponse>} - The API response with status code and data/error
 */
export async function getJobByUsaJobsId(
  usaJobsId: string
): Promise<ApiResponse> {
  const client = generateClient();

  try {
    const query = `
      query GetJobByUsaJobsId($usaJobsId: String!) {
        listJobs(filter: {usaJobsId: {eq: $usaJobsId}}) {
          items {
            id
            createdAt
            updatedAt
            agencyDescription
            department
            duties
            evaluationCriteria
            qualificationsSummary
            questionnaire
            requiredDocuments
            title
            topics {
                items {
                id
                jobId
                keywords
                title
                }
            }
            usaJobsId
          }
        }
      }
    `;

    const result = await client.graphql({
      query,
      variables: {
        usaJobsId,
      },
      authMode: "userPool",
    });

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
      error: `Job with usaJobsId: ${usaJobsId} not found`,
      statusCode: 404,
    };
  } catch (error) {
    console.error("Error in getJobByUsaJobsId:", error);
    return {
      success: false,
      error: "Failed to fetch job by usaJobsId",
      statusCode: 500,
    };
  }
}
/**
 * Creates a new Job record or retrieves an existing one with the same usaJobsId
 *
 * @param {Object} jobData - The job data to create
 * @returns {Promise<ApiResponse>} - The API response with created or retrieved job record
 */
export async function createOrGetJob(jobData: {
  agencyDescription?: string;
  department?: string;
  duties?: string;
  evaluationCriteria?: string;
  qualificationsSummary?: string;
  requiredDocuments?: string;
  title: string;
  usaJobsId: string;
}): Promise<ApiResponse> {
  const client = generateClient();

  try {
    // First, check if a job with this usaJobsId already exists
    const existingJobResult = await getJobByUsaJobsId(jobData.usaJobsId);

    if (existingJobResult.success && existingJobResult.data) {
      return existingJobResult;
    }

    // If no existing job was found, create a new one

    // Extract fields we don't want to include in the create operation
    const { createdAt, id, updatedAt, topics, ...filteredJobData } =
      jobData as any;

    // Create the GraphQL mutation query
    const mutation = `
      mutation CreateJob($input: CreateJobInput!) {
        createJob(input: $input) {
          id
          createdAt
          updatedAt
          agencyDescription
          department
          duties
          evaluationCriteria
          qualificationsSummary
          questionnaire
          requiredDocuments
          title
          topics {
                items {
                id
                jobId
                keywords
                title
                }
            }
          usaJobsId
        }
      }
    `;

    // Execute the GraphQL mutation
    const createResult = await client.graphql({
      query: mutation,
      variables: {
        input: filteredJobData,
      },
      authMode: "userPool",
    });

    // Verify successful creation
    if ("data" in createResult && createResult.data?.createJob) {
      return {
        success: true,
        data: createResult.data.createJob,
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
    console.error("Error in createOrGetJob:", error);
    return {
      success: false,
      error: "Failed to create or retrieve Job record",
      statusCode: 500,
    };
  }
}
/**
 * Example usage:
 *
 * const jobResult = await createOrGetJob({
 *   agencyDescription: "Department of Example",
 *   department: "Example Agency",
 *   duties: "Various duties...",
 *   evaluationCriteria: "Will be evaluated based on...",
 *   qualificationsSummary: "Must have experience in...",
 *   requiredDocuments: "Resume, cover letter...",
 *   title: "Software Engineer",
 *   usaJobsId: "ABC12345"
 * });
 *
 * if (jobResult.success) {
 *   console.log("Job:", jobResult.data);
 * } else {
 *   console.error(`Error ${jobResult.statusCode}:`, jobResult.error);
 * }
 */
export async function getJobByApplicationId(
  applicationId: string
): Promise<ApiResponse> {
  const client = generateClient();

  try {
    // First, get the application to find its jobId
    const getApplicationQuery = `
        query GetApplication($applicationId: ID!) {
          getApplication(id: $applicationId) {
            id
            jobId
          }
        }
      `;

    const applicationResult = await client.graphql({
      query: getApplicationQuery,
      variables: {
        applicationId: applicationId,
      },
      authMode: "userPool",
    });

    if (
      "data" in applicationResult &&
      applicationResult.data?.getApplication?.jobId
    ) {
      const jobId = applicationResult.data.getApplication.jobId;

      // Now get the job using the jobId
      const getJobQuery = `
          query GetJob($jobId: ID!) {
            getJob(id: $jobId) {
              id
              createdAt
              updatedAt
              agencyDescription
              department
              duties
              evaluationCriteria
              qualificationsSummary
              questionnaire
              requiredDocuments
              title
              topics {
                items {
                id
                jobId
                keywords
                title
                }
            }
              usaJobsId
            }
          }
        `;

      const jobResult = await client.graphql({
        query: getJobQuery,
        variables: {
          jobId: jobId,
        },
        authMode: "userPool",
      });

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
      error: `Job not found for application ID: ${applicationId}`,
      statusCode: 404,
    };
  } catch (error) {
    console.error("Error in getJobByApplicationId:", error);
    return {
      success: false,
      error: "Failed to fetch job by application ID",
      statusCode: 500,
    };
  }
}
