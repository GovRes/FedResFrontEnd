import { generateClient } from "aws-amplify/api";
import { PastJobType, VolunteerType } from "../utils/responseSchemas";
/**
 * Creates and saves multiple records (PastJob or Volunteer), checking if each one already exists.
 *
 * @param {string} modelType - The type of model ("PastJob" or "Volunteer")
 * @param {Object[]} recordsInput - Array of record data objects
 * @param {string} recordsInput[].title - The position title
 * @param {string} recordsInput[].organization - The organization name
 * @param {string} [recordsInput[].startDate] - Optional start date
 * @param {string} [recordsInput[].endDate] - Optional end date
 * @param {string} [recordsInput[].hours] - Optional hours
 * @param {string} [recordsInput[].gsLevel] - Optional GS level
 * @param {string} [recordsInput[].responsibilities] - Optional responsibilities
 * @param {string} userId - The user ID to associate with new records
 * @returns {Promise<Object[]>} - The array of existing or newly created records
 */
export async function createAndSavePositionRecords(
  modelType: string,
  recordsInput: PastJobType[] | VolunteerType[],
  userId: string
) {
  if (modelType !== "PastJob" && modelType !== "Volunteer") {
    throw new Error(
      `Invalid model type: ${modelType}. Must be "PastJob" or "Volunteer"`
    );
  }

  // Set up queries based on model type
  const listQueryName =
    modelType === "PastJob" ? "listPastJobs" : "listVolunteers";
  const createMutationName =
    modelType === "PastJob" ? "createPastJob" : "createVolunteer";
  const filterInputType =
    modelType === "PastJob"
      ? "ModelPastJobFilterInput"
      : "ModelVolunteerFilterInput";
  const createInputType =
    modelType === "PastJob" ? "CreatePastJobInput" : "CreateVolunteerInput";

  const client = generateClient();
  const results = [];

  // Process each record in the input array
  for (const recordInput of recordsInput) {
    const {
      title,
      organization,
      startDate,
      endDate,
      hours,
      gsLevel,
      responsibilities,
    } = recordInput;

    // Check if a record with the same title and organization exists
    // Debug the values being compared
    console.log("Checking for duplicates with:", { title, organization });

    const existingRecordsResult = await client.graphql({
      query: `
        query List${modelType}s($filter: ${filterInputType}, $limit: Int) {
          ${listQueryName}(filter: $filter, limit: $limit) {
            items {
              id
              title
              organization
            }
          }
        }
      `,
      variables: {
        filter: {
          and: [
            { title: { eq: title } },
            { organization: { eq: organization } },
            { userId: { eq: userId } },
          ],
        },
        limit: 10,
      },
      authMode: "userPool",
    });
    // Debug what was returned
    console.log(
      "Query results:",
      JSON.stringify(existingRecordsResult, null, 2)
    );
    // Explicit type checking for the response
    if (
      "data" in existingRecordsResult &&
      existingRecordsResult.data?.[listQueryName]?.items
    ) {
      const items = existingRecordsResult.data[listQueryName].items;
      if (items.length > 0) {
        // Found existing record, add to results
        results.push(items[0]);
        continue; // Skip to next record
      }
    }

    // No existing record found, create a new one
    const createInput: {
      title: string;
      organization: string;
      startDate?: string;
      endDate?: string;
      hours?: string;
      responsibilities?: string;
      userId: string;
      gsLevel?: string;
    } = {
      title,
      organization,
      startDate,
      endDate,
      hours,
      responsibilities,
      userId,
    };

    // Only add gsLevel if it's defined
    if (gsLevel !== undefined) {
      createInput.gsLevel = gsLevel;
    }

    const createRecordResult = await client.graphql({
      query: `
      mutation Create${modelType}($input: ${createInputType}!) {
        ${createMutationName}(input: $input) {
        id
        title
        organization
        startDate
        endDate
        hours
        gsLevel
        responsibilities
        userId
        createdAt
        updatedAt
        }
      }
      `,
      variables: {
        input: createInput,
      },
      authMode: "userPool",
    });

    // Explicit type checking for the create response
    if (
      "data" in createRecordResult &&
      createRecordResult.data?.[createMutationName]
    ) {
      results.push(createRecordResult.data[createMutationName]);
    } else {
      throw new Error(
        `Failed to create ${modelType.toLowerCase()} record: ${title} at ${organization}`
      );
    }
  }

  return results;
}

const deletePastJobMutation = /* GraphQL */ `
  mutation DeletePastJob($input: DeletePastJobInput!) {
    deletePastJob(input: $input) {
      id
    }
  }
`;

// Create a client to interact with the API
const client = generateClient();

// Example function to delete a job by its ID
export async function deletePastJob(jobId: string) {
  try {
    // Prepare the input object with the job ID
    const input = {
      id: jobId,
    };

    // Execute the delete mutation
    const response = await client.graphql({
      query: deletePastJobMutation,
      variables: {
        input: input,
      },
      authMode: "userPool",
    });
    console.log(response);
    // Explicit type checking for the create response
    if ("data" in response && response.data?.[deletePastJobMutation]) {
      return response.data.deleteJob;
    } else {
      throw new Error(`Failed to delete job record: ${jobId}`);
    }
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
}

/**
 * Fetches all PastJob or Volunteer records for a specific user
 *
 * @param {string} modelType - The type of model ("PastJob" or "Volunteer")
 * @param {string} userId - The user ID to fetch records for
 * @param {number} [limit=100] - Maximum number of records to retrieve
 * @param {string} [nextToken] - Token for pagination
 * @returns {Promise<Object>} - Object containing items array and nextToken if applicable
 */
export async function fetchUserPositionRecords(
  modelType: string,
  userId: string,
  limit: number = 100,
  nextToken?: string
) {
  if (modelType !== "PastJob" && modelType !== "Volunteer") {
    throw new Error(
      `Invalid model type: ${modelType}. Must be "PastJob" or "Volunteer"`
    );
  }

  // Set up query based on model type
  const listQueryName =
    modelType === "PastJob" ? "listPastJobs" : "listVolunteers";
  const filterInputType =
    modelType === "PastJob"
      ? "ModelPastJobFilterInput"
      : "ModelVolunteerFilterInput";

  const client = generateClient();

  try {
    console.log(191);
    const response = await client.graphql({
      query: `
        query List${modelType}s($filter: ${filterInputType}, $limit: Int, $nextToken: String) {
          ${listQueryName}(filter: $filter, limit: $limit, nextToken: $nextToken) {
            items {
              id
              title
              organization
              startDate
              endDate
              hours
              gsLevel
              responsibilities
              userId
              createdAt
              updatedAt
            }
            nextToken
          }
        }
      `,
      variables: {
        filter: {
          userId: { eq: userId },
        },
        limit,
        nextToken,
      },
      authMode: "userPool",
    });

    // Verify and return the response data
    if ("data" in response && response.data?.[listQueryName]) {
      console.log(response.data[listQueryName].items);
      return {
        items: response.data[listQueryName].items,
        nextToken: response.data[listQueryName].nextToken,
      };
    } else {
      throw new Error(
        `Failed to fetch ${modelType.toLowerCase()} records for user: ${userId}`
      );
    }
  } catch (error) {
    console.error(`Error fetching ${modelType.toLowerCase()} records:`, error);
    throw error;
  }
}
