import { generateClient } from "aws-amplify/api";
import { AwardType } from "../utils/responseSchemas";
import { fetchAuthSession } from "aws-amplify/auth";

/**
 * Creates and saves multiple awards, checking if each one already exists.
 *
 * @param {Object[]} awardsInput - Array of award data objects
 * @param {string} awardsInput[].title - The title of the award
 * @param {string} awardsInput[].date - The date of the award
 * @param {string} userId - The user ID to associate with new awards
 * @returns {Promise<Object[]>} - The array of existing or newly created awards
 */
export async function createAndSaveAwards(
  awardsInput: AwardType[],
  userId: string
) {
  const client = generateClient();
  const results = [];

  // Process each award in the input array
  for (const awardInput of awardsInput) {
    const { title, date } = awardInput;

    // Check if an award with the same title and date exists
    const existingAwardsResult = await client.graphql({
      query: `
          query ListAwards($filter: ModelAwardFilterInput, $limit: Int) {
            listAwards(filter: $filter, limit: $limit) {
              items {
                id
                title
                date
                userId
                createdAt
                updatedAt
              }
            }
          }
        `,
      variables: {
        filter: {
          title: { eq: title },
          date: { eq: date },
        },
        limit: 1,
      },
      authMode: "userPool",
    });

    // Explicit type checking for the response
    if (
      "data" in existingAwardsResult &&
      existingAwardsResult.data?.listAwards?.items
    ) {
      const items = existingAwardsResult.data.listAwards.items;
      if (items.length > 0) {
        // Found existing award, add to results
        results.push(items[0]);
        continue; // Skip to next award
      }
    }

    // No existing award found, create a new one
    const createAwardResult = await client.graphql({
      query: `
          mutation CreateAward($input: CreateAwardInput!) {
            createAward(input: $input) {
              id
              title
              date
              userId
              createdAt
              updatedAt
            }
          }
        `,
      variables: {
        input: {
          title,
          date,
          userId,
        },
      },
      authMode: "userPool",
    });

    // Explicit type checking for the create response
    if ("data" in createAwardResult && createAwardResult.data?.createAward) {
      results.push(createAwardResult.data.createAward);
    } else {
      throw new Error(`Failed to create award: ${title} (${date})`);
    }
  }

  return results;
}

/**
 * Updates an existing award with new information.
 *
 * @param {string} id - The ID of the award to update
 * @param {Object} updateData - The award data to update
 * @param {string} [updateData.title] - The new title of the award
 * @param {string} [updateData.date] - The new date of the award
 * @returns {Promise<AwardType>} - The updated award object
 */
export async function updateAward(
  id: string,
  updateData: { title?: string; date?: string }
): Promise<AwardType> {
  const client = generateClient();

  try {
    // Create the input for the update mutation
    const updateInput = {
      id,
      ...updateData,
    };

    // Execute update mutation
    const updateAwardResult = await client.graphql({
      query: `
        mutation UpdateAward($input: UpdateAwardInput!) {
          updateAward(input: $input) {
            id
            title
            date
            userId
            createdAt
            updatedAt
          }
        }
      `,
      variables: {
        input: updateInput,
      },
      authMode: "userPool",
    });

    // Explicit type checking for the update response
    if ("data" in updateAwardResult && updateAwardResult.data?.updateAward) {
      return updateAwardResult.data.updateAward as AwardType;
    } else {
      throw new Error(`Failed to update award with ID: ${id}`);
    }
  } catch (error) {
    console.error("Error updating award:", error);
    throw error;
  }
}

/**
 * Fetches all awards for the currently logged-in user.
 *
 * @returns {Promise<AwardType[]>} - Array of award objects belonging to the logged-in user
 */
export async function fetchUserAwards(): Promise<AwardType[]> {
  const client = generateClient();

  try {
    // Get the current authenticated user's info
    const { identityId } = await fetchAuthSession();

    // Query all awards for the current user
    const userAwardsResult = await client.graphql({
      query: `
        query ListAwards($filter: ModelAwardFilterInput, $limit: Int) {
          listAwards(filter: $filter, limit: $limit) {
            items {
              id
              title
              date
              userId
              createdAt
              updatedAt
            }
          }
        }
      `,
      variables: {
        filter: {
          userId: { eq: identityId },
        },
        limit: 1000, // Adjust based on expected number of awards
      },
      authMode: "userPool",
    });

    // Explicit type checking for the response
    console.log(userAwardsResult);
    if (
      "data" in userAwardsResult &&
      userAwardsResult.data?.listAwards?.items
    ) {
      return userAwardsResult.data.listAwards.items as AwardType[];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching user awards:", error);
    throw error;
  }
}
