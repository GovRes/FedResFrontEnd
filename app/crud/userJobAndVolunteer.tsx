import { generateClient } from "aws-amplify/api";
import { UserJobType, VolunteerType } from "../utils/responseSchemas";
/**
 * Creates and saves multiple records (UserJob or Volunteer), checking if each one already exists.
 *
 * @param {string} modelType - The type of model ("UserJob" or "Volunteer")
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
  recordsInput: UserJobType[] | VolunteerType[],
  userId: string
) {
  if (modelType !== "UserJob" && modelType !== "Volunteer") {
    throw new Error(
      `Invalid model type: ${modelType}. Must be "UserJob" or "Volunteer"`
    );
  }

  // Set up queries based on model type
  const listQueryName =
    modelType === "UserJob" ? "listUserJobs" : "listVolunteers";
  const createMutationName =
    modelType === "UserJob" ? "createUserJob" : "createVolunteer";
  const filterInputType =
    modelType === "UserJob"
      ? "ModelUserJobFilterInput"
      : "ModelVolunteerFilterInput";
  const createInputType =
    modelType === "UserJob" ? "CreateUserJobInput" : "CreateVolunteerInput";

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

const deleteUserJobMutation = /* GraphQL */ `
  mutation DeleteUserJob($input: DeleteUserJobInput!) {
    deleteUserJob(input: $input) {
      id
    }
  }
`;

// Create a client to interact with the API
const client = generateClient();

// Example function to delete a job by its ID
export async function deleteUserJob(jobId: string) {
  try {
    // Prepare the input object with the job ID
    const input = {
      id: jobId,
    };

    // Execute the delete mutation
    const response = await client.graphql({
      query: deleteUserJobMutation,
      variables: {
        input: input,
      },
      authMode: "userPool",
    });
    console.log(response);
    // Explicit type checking for the create response
    if ("data" in response && response.data?.[deleteUserJobMutation]) {
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
 * Fetches all UserJob or Volunteer records for a specific user
 *
 * @param {string} modelType - The type of model ("UserJob" or "Volunteer")
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
  if (modelType !== "UserJob" && modelType !== "Volunteer") {
    throw new Error(
      `Invalid model type: ${modelType}. Must be "UserJob" or "Volunteer"`
    );
  }

  // Set up query based on model type
  const listQueryName =
    modelType === "UserJob" ? "listUserJobs" : "listVolunteers";
  const filterInputType =
    modelType === "UserJob"
      ? "ModelUserJobFilterInput"
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
