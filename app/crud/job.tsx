import { generateClient } from "aws-amplify/api";

/**
 * Creates a new Job record or retrieves an existing one with the same usaJobsId
 *
 * @param {Object} jobData - The job data to create
 * @returns {Promise<Object>} - The created or retrieved job record
 * @throws {Error} - If creation fails
 */
export async function createOrGetJob(jobData: {
  agencyDescription: string;
  department: string;
  duties: string;
  evaluationCriteria: string;
  qualificationsSummary: string;
  requiredDocuments: string;
  title: string;
  usaJobsId: string;
}) {
  const client = generateClient();

  try {
    // First, check if a job with this usaJobsId already exists
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
            requiredDocuments
            title
            topics {
                items {
                id
                keywords
                title
                }
            }
            usaJobsId
          }
        }
      }
    `;

    const existingJobResult = await client.graphql({
      query,
      variables: {
        usaJobsId: jobData.usaJobsId,
      },
      authMode: "userPool",
    });

    // Check if we found a job with that usaJobsId
    if (
      "data" in existingJobResult &&
      existingJobResult.data?.listJobs?.items?.length > 0
    ) {
      // Flatten the topics.items into a topics array
      const existingJob = existingJobResult.data.listJobs.items[0];
      const flattenedJob = {
        ...existingJob,
        topics: existingJob.topics?.items || [],
      };

      return flattenedJob;
    }

    // If no existing job was found, create a new one

    // Extract fields we don't want to include in the create operation
    const { createdAt, id, updatedAt, ...filteredJobData } = jobData as any;

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
          requiredDocuments
          title
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
      return createResult.data.createJob;
    } else {
      throw new Error("Failed to create Job record");
    }
  } catch (error) {
    console.error("Error in createOrGetJob:", error);
    throw error;
  }
}

/**
 * Example usage:
 *
 * const job = await createOrGetJob({
 *   agencyDescription: "Department of Example",
 *   department: "Example Agency",
 *   duties: "Various duties...",
 *   evaluationCriteria: "Will be evaluated based on...",
 *   qualificationsSummary: "Must have experience in...",
 *   requiredDocuments: "Resume, cover letter...",
 *   title: "Software Engineer",
 *   usaJobsId: "ABC12345"
 * });
 */

export async function getJobByApplicationId(applicationId: string) {
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
        applicationId: applicationId, // Fixed: now using applicationId as defined in the query
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
              requiredDocuments
              title
              topics {
                items {
                  id
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
          jobId: jobId, // Fixed: variable name now matches the query definition
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

        return flattenedJob;
      }
    }

    return null;
  } catch (error) {
    console.error("Error in getJobByApplicationId:", error);
    throw error;
  }
}
