import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { getCurrentUser } from "aws-amplify/auth";

// Make sure the client is properly initialized with the correct schema
const initializeClient = async () => {
  try {
    // Ensure user is authenticated first
    await getCurrentUser();

    // Generate client after confirming authentication
    const client = generateClient<Schema>();
    return client;
  } catch (error) {
    console.error("Error initializing client:", error);
    throw error;
  }
};

/**
 * Function to fetch a single user by ID
 *
 * @param {string} id - The ID of the user to fetch
 * @returns {Promise<Schema['User']['type'] | null>} - The fetched user data or null
 * @throws {Error} - If fetching fails
 */
export async function fetchUserRecord(
  id: string
): Promise<Schema["User"]["type"] | null> {
  const client = await initializeClient();
  try {
    const { data: user, errors } = await client.models.User.get({ id });

    if (errors && errors.length > 0) {
      throw new Error(
        `Failed to fetch user: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    return user;
  } catch (error) {
    console.error(`Error fetching user record:`, error);
    throw error;
  }
}

/**
 * Function to fetch multiple users with optional filtering and pagination
 *
 * @param {object} filter - Optional filter object for the query
 * @param {number} limit - Optional limit for the number of records to fetch
 * @param {string} nextToken - Optional pagination token
 * @returns {Promise<{data: Schema['User']['type'][], nextToken?: string}>} - List result with items and nextToken
 * @throws {Error} - If fetching fails
 */
export async function listUserRecords(options?: {
  filter?: any;
  limit?: number;
  nextToken?: string;
}): Promise<{ data: Schema["User"]["type"][]; nextToken?: string }> {
  const client = await initializeClient();
  try {
    const {
      data: users,
      errors,
      nextToken,
    } = await client.models.User.list({
      filter: options?.filter,
      limit: options?.limit,
      nextToken: options?.nextToken,
    });

    if (errors && errors.length > 0) {
      throw new Error(
        `Failed to list users: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    return { data: users, nextToken: nextToken || undefined };
  } catch (error) {
    console.error(`Error listing user records:`, error);
    throw error;
  }
}

/**
 * Function to create a new user record
 */
export async function createUserRecord(
  userData: Omit<
    Schema["User"]["type"],
    "id" | "createdAt" | "updatedAt" | "owner"
  >
): Promise<Schema["User"]["type"]> {
  const client = await initializeClient();
  try {
    const { data: user, errors } = await client.models.User.create(userData);

    if (errors && errors.length > 0) {
      throw new Error(
        `Failed to create user: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    if (!user) {
      throw new Error("Failed to create user: No data returned");
    }

    return user;
  } catch (error) {
    console.error(`Error creating user record:`, error);
    throw error;
  }
}

/**
 * Function to update an existing user record
 */
export async function updateUserRecord(
  id: string,
  updates: Partial<Schema["User"]["type"]>
): Promise<Schema["User"]["type"]> {
  const client = await initializeClient();
  try {
    const { data: user, errors } = await client.models.User.update({
      id,
      ...updates,
    });

    if (errors && errors.length > 0) {
      throw new Error(
        `Failed to update user: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    if (!user) {
      throw new Error("Failed to update user: No data returned");
    }

    return user;
  } catch (error) {
    console.error(`Error updating user record:`, error);
    throw error;
  }
}
