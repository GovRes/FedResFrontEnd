import { generateClient } from "aws-amplify/api";
import { JobType } from "../utils/responseSchemas";
import { fetchAuthSession } from "aws-amplify/auth";

/**
 * Checks if a job with the same title and department already exists
 *
 * @param {string} usaJobsId - returned from search as MatchedObjectRecordId
 * @returns {Promise<Object|null>} - Returns the existing job or null if not found
 */
const checkJobExists = async (usaJobsId: string) => {
  const client = generateClient();
  try {
    const response = await client.graphql({
      query: `
        query ListJobs($filter: ModelJobFilterInput) {
          listJobs(filter: $filter) {
            items {
              id
              title
              department
              agencyDescription
              duties
              evaluationCriteria
              qualificationsSummary
              requiredDocuments
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: {
        filter: {
          usaJobsId: { eq: usaJobsId },
        },
      },
      authMode: "userPool",
    });

    // Check if response is a GraphQLResult with data property
    if ("data" in response && response.data?.listJobs?.items) {
      const jobs = response.data.listJobs.items;
      return jobs.length > 0 ? jobs[0] : null;
    }

    return null;
  } catch (error) {
    console.error("Error checking if job exists:", error);
    throw error;
  }
};

/**
 * Creates a new Job object or returns existing one if it already exists
 *
 * @param {Object} params - Parameters for the Job
 * @param {string} params.title - The title of the job
 * @param {string} params.department - The department of the job
 * @param {string} params.agencyDescription - Description of the agency
 * @param {string} params.duties - Job duties
 * @param {string} params.evaluationCriteria - Criteria for evaluation
 * @param {string} params.qualificationsSummary - Summary of qualifications
 * @param {string} params.requiredDocuments - Documents required for application
 * @param {boolean} params.updateIfExists - Whether to update the job if it exists (default: false)
 * @returns {Promise<Object>} - The created or existing Job object
 */
export const createAndSaveJob = async ({
  title,
  department,
  agencyDescription,
  duties,
  evaluationCriteria,
  qualificationsSummary,
  requiredDocuments,
  usaJobsId,
}: JobType) => {
  try {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      throw new Error("No valid authentication session found");
    }
  } catch (error) {
    console.error("No user is signed in");
    // Redirect to login page
    return;
  }
  const client = generateClient();
  try {
    // Validate required parameters
    if (
      !title ||
      !department ||
      !agencyDescription ||
      !duties ||
      !evaluationCriteria ||
      !qualificationsSummary ||
      !requiredDocuments ||
      !usaJobsId
    ) {
      console.log({
        title,
        department,
        agencyDescription,
        duties,
        evaluationCriteria,
        qualificationsSummary,
        requiredDocuments,
        usaJobsId,
      });
      throw new Error("All job fields are required");
    }
    // Ensure we have an authenticated session
    const { tokens } = await fetchAuthSession();

    if (!tokens) {
      throw new Error("User must be authenticated to create a job");
    }

    // Check if job already exists
    const existingJob = await checkJobExists(usaJobsId);

    if (existingJob) {
      console.log(
        "Job with this title and department already exists:",
        existingJob
      );
      // If not updating, return the existing job
      return existingJob;
    }

    // If job doesn't exist, create a new one
    const jobInput = {
      title,
      department,
      agencyDescription,
      duties,
      evaluationCriteria,
      qualificationsSummary,
      requiredDocuments,
      usaJobsId,
    };

    const createResponse = await client.graphql({
      query: `
        mutation CreateJob($input: CreateJobInput!) {
          createJob(input: $input) {
            id
            title
            department
            agencyDescription
            duties
            evaluationCriteria
            qualificationsSummary
            requiredDocuments
            usaJobsId
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        input: jobInput,
      },
      authMode: "userPool",
    });

    // Type-safe access to data
    if ("data" in createResponse) {
      return createResponse.data.createJob;
    }

    throw new Error("Failed to create job: No data returned");
  } catch (error) {
    console.error("Error in createAndSaveJob:", error);
    // Provide more helpful error message for auth issues
    // Define a type for API errors
    type ApiError = {
      message?: string;
      code?: string;
      name?: string;
      statusCode?: number;
    };

    // Cast unknown error to ApiError to safely access properties
    const apiError = error as ApiError;
    if (
      apiError.message &&
      (apiError.message.includes("not authorized") ||
        apiError.message.includes("unauthorized"))
    ) {
      console.error(
        "Authentication error: Make sure the user is signed in and has the correct permissions"
      );
    }

    throw error;
  }
};

/**
 * Retrieves a job from the database by its ID
 *
 * @param {string} jobId - The unique identifier of the job
 * @returns {Promise<JobType|null>} - The job object or null if not found
 */
export const getJobById = async (jobId: string): Promise<JobType | null> => {
  const client = generateClient();
  try {
    // Ensure we have an authenticated session
    try {
      const session = await fetchAuthSession();
      if (!session.tokens) {
        throw new Error("No valid authentication session found");
      }
    } catch (error) {
      console.error("No user is signed in");
      return null;
    }

    const response = await client.graphql({
      query: `
        query GetJob($id: ID!) {
          getJob(id: $id) {
            id
            title
            department
            agencyDescription
            duties
            evaluationCriteria
            qualificationsSummary
            requiredDocuments
            usaJobsId
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        id: jobId,
      },
      authMode: "userPool",
    });

    // Check if response has data and job exists
    if ("data" in response && response.data?.getJob) {
      return response.data.getJob;
    }

    return null;
  } catch (error) {
    console.error("Error fetching job by ID:", error);
    throw error;
  }
};
