import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { getCurrentUser } from "aws-amplify/auth";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

// Make sure the client is properly initialized with the correct schema
const initializeClient = async (): Promise<
  ApiResponse<ReturnType<typeof generateClient<Schema>>>
> => {
  try {
    // Ensure user is authenticated first
    await getCurrentUser();

    // Generate client after confirming authentication
    const client = generateClient<Schema>();
    return {
      success: true,
      data: client,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error initializing client:", error);
    return {
      success: false,
      error: `Authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 401,
    };
  }
};

/**
 * Function to fetch a single user by ID
 *
 * @param {string} id - The ID of the user to fetch
 * @returns {Promise<ApiResponse<Schema['User']['type']>>} - The API response with fetched user data
 */
export async function fetchUserRecord(
  id: string
): Promise<ApiResponse<Schema["User"]["type"]>> {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    return {
      success: false,
      error: "Invalid ID: ID must be a non-empty string",
      statusCode: 400,
    };
  }

  const clientResponse = await initializeClient();
  if (!clientResponse.success || !clientResponse.data) {
    return {
      success: false,
      error: clientResponse.error || "Failed to initialize client",
      statusCode: clientResponse.statusCode,
    };
  }

  const client = clientResponse.data;

  try {
    const { data: user, errors } = await client.models.User.get({ id });

    if (errors && errors.length > 0) {
      const errorMessage = errors.map((e) => e.message).join(", ");

      // Check if it's a "not found" error
      if (
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("does not exist")
      ) {
        return {
          success: false,
          error: `User with ID: ${id} not found`,
          statusCode: 404,
        };
      }

      return {
        success: false,
        error: `Failed to fetch user: ${errorMessage}`,
        statusCode: 500,
      };
    }

    if (!user) {
      return {
        success: false,
        error: `User with ID: ${id} not found`,
        statusCode: 404,
      };
    }

    return {
      success: true,
      data: user,
      statusCode: 200,
    };
  } catch (error) {
    console.error(`Error fetching user record:`, error);
    return {
      success: false,
      error: `Failed to fetch user with ID: ${id}`,
      statusCode: 500,
    };
  }
}

/**
 * Function to fetch multiple users with optional filtering and pagination
 *
 * @param {object} options - Optional configuration object
 * @param {object} options.filter - Optional filter object for the query
 * @param {number} options.limit - Optional limit for the number of records to fetch
 * @param {string} options.nextToken - Optional pagination token
 * @returns {Promise<ApiResponse<{items: Schema['User']['type'][], nextToken?: string}>>} - API response with list result
 */
export async function listUserRecords(options?: {
  filter?: any;
  limit?: number;
  nextToken?: string;
}): Promise<
  ApiResponse<{ items: Schema["User"]["type"][]; nextToken?: string }>
> {
  // Validate options if provided
  if (
    options?.limit !== undefined &&
    (options.limit <= 0 || options.limit > 1000)
  ) {
    return {
      success: false,
      error: "Invalid limit: limit must be between 1 and 1000",
      statusCode: 400,
    };
  }

  const clientResponse = await initializeClient();
  if (!clientResponse.success || !clientResponse.data) {
    return {
      success: false,
      error: clientResponse.error || "Failed to initialize client",
      statusCode: clientResponse.statusCode,
    };
  }

  const client = clientResponse.data;

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
      return {
        success: false,
        error: `Failed to list users: ${errors.map((e) => e.message).join(", ")}`,
        statusCode: 500,
      };
    }

    return {
      success: true,
      data: {
        items: users,
        nextToken: nextToken || undefined,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error(`Error listing user records:`, error);
    return {
      success: false,
      error: "Failed to list users",
      statusCode: 500,
    };
  }
}

/**
 * Function to create a new user record
 *
 * @param {object} userData - The user data to create (excluding auto-generated fields)
 * @returns {Promise<ApiResponse<Schema['User']['type']>>} - The API response with created user data
 */
export async function createUserRecord(
  userData: Omit<
    Schema["User"]["type"],
    "id" | "createdAt" | "updatedAt" | "owner"
  >
): Promise<ApiResponse<Schema["User"]["type"]>> {
  // Validate userData
  if (!userData || typeof userData !== "object") {
    return {
      success: false,
      error: "Invalid userData: userData must be a non-null object",
      statusCode: 400,
    };
  }

  const clientResponse = await initializeClient();
  if (!clientResponse.success || !clientResponse.data) {
    return {
      success: false,
      error: clientResponse.error || "Failed to initialize client",
      statusCode: clientResponse.statusCode,
    };
  }

  const client = clientResponse.data;

  try {
    const { data: user, errors } = await client.models.User.create(userData);

    if (errors && errors.length > 0) {
      const errorMessage = errors.map((e) => e.message).join(", ");

      // Check for validation errors
      if (
        errorMessage.toLowerCase().includes("validation") ||
        errorMessage.toLowerCase().includes("required") ||
        errorMessage.toLowerCase().includes("invalid")
      ) {
        return {
          success: false,
          error: `Validation failed: ${errorMessage}`,
          statusCode: 400,
        };
      }

      return {
        success: false,
        error: `Failed to create user: ${errorMessage}`,
        statusCode: 500,
      };
    }

    if (!user) {
      return {
        success: false,
        error: "Failed to create user: No data returned",
        statusCode: 500,
      };
    }

    return {
      success: true,
      data: user,
      statusCode: 201,
    };
  } catch (error) {
    console.error(`Error creating user record:`, error);
    return {
      success: false,
      error: "Failed to create user",
      statusCode: 500,
    };
  }
}

/**
 * Function to update an existing user record
 *
 * @param {string} id - The ID of the user to update
 * @param {object} updates - The partial user data to update
 * @returns {Promise<ApiResponse<Schema['User']['type']>>} - The API response with updated user data
 */
export async function updateUserRecord(
  id: string,
  updates: Partial<Schema["User"]["type"]>
): Promise<ApiResponse<Schema["User"]["type"]>> {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    return {
      success: false,
      error: "Invalid ID: ID must be a non-empty string",
      statusCode: 400,
    };
  }

  // Validate updates
  if (!updates || typeof updates !== "object") {
    return {
      success: false,
      error: "Invalid updates: updates must be a non-null object",
      statusCode: 400,
    };
  }

  // Check if there are actual fields to update
  const fieldsToUpdate = Object.keys(updates).filter(
    (key) =>
      key !== "id" &&
      key !== "createdAt" &&
      key !== "updatedAt" &&
      key !== "owner"
  );

  if (fieldsToUpdate.length === 0) {
    return {
      success: false,
      error: "No valid fields to update",
      statusCode: 400,
    };
  }

  const clientResponse = await initializeClient();
  if (!clientResponse.success || !clientResponse.data) {
    return {
      success: false,
      error: clientResponse.error || "Failed to initialize client",
      statusCode: clientResponse.statusCode,
    };
  }

  const client = clientResponse.data;

  try {
    const { data: user, errors } = await client.models.User.update({
      id,
      ...updates,
    });

    if (errors && errors.length > 0) {
      const errorMessage = errors.map((e) => e.message).join(", ");

      // Check if it's a "not found" error
      if (
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("does not exist")
      ) {
        return {
          success: false,
          error: `User with ID: ${id} not found`,
          statusCode: 404,
        };
      }

      // Check for validation errors
      if (
        errorMessage.toLowerCase().includes("validation") ||
        errorMessage.toLowerCase().includes("required") ||
        errorMessage.toLowerCase().includes("invalid")
      ) {
        return {
          success: false,
          error: `Validation failed: ${errorMessage}`,
          statusCode: 400,
        };
      }

      return {
        success: false,
        error: `Failed to update user: ${errorMessage}`,
        statusCode: 500,
      };
    }

    if (!user) {
      return {
        success: false,
        error: `User with ID: ${id} not found or could not be updated`,
        statusCode: 404,
      };
    }

    return {
      success: true,
      data: user,
      statusCode: 200,
    };
  } catch (error) {
    console.error(`Error updating user record:`, error);
    return {
      success: false,
      error: `Failed to update user with ID: ${id}`,
      statusCode: 500,
    };
  }
}

/**
 * Function to delete a user record
 *
 * @param {string} id - The ID of the user to delete
 * @returns {Promise<ApiResponse<Schema['User']['type']>>} - The API response with deleted user data
 */
export async function deleteUserRecord(
  id: string
): Promise<ApiResponse<Schema["User"]["type"]>> {
  // Validate ID
  if (!id || typeof id !== "string" || id.trim() === "") {
    return {
      success: false,
      error: "Invalid ID: ID must be a non-empty string",
      statusCode: 400,
    };
  }

  const clientResponse = await initializeClient();
  if (!clientResponse.success || !clientResponse.data) {
    return {
      success: false,
      error: clientResponse.error || "Failed to initialize client",
      statusCode: clientResponse.statusCode,
    };
  }

  const client = clientResponse.data;

  try {
    const { data: user, errors } = await client.models.User.delete({ id });

    if (errors && errors.length > 0) {
      const errorMessage = errors.map((e) => e.message).join(", ");

      // Check if it's a "not found" error
      if (
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage.toLowerCase().includes("does not exist")
      ) {
        return {
          success: false,
          error: `User with ID: ${id} not found`,
          statusCode: 404,
        };
      }

      return {
        success: false,
        error: `Failed to delete user: ${errorMessage}`,
        statusCode: 500,
      };
    }

    if (!user) {
      return {
        success: false,
        error: `User with ID: ${id} not found`,
        statusCode: 404,
      };
    }

    return {
      success: true,
      data: user,
      statusCode: 200,
    };
  } catch (error) {
    console.error(`Error deleting user record:`, error);
    return {
      success: false,
      error: `Failed to delete user with ID: ${id}`,
      statusCode: 500,
    };
  }
}

/**
 * Example usage:
 *
 * // Fetch a single user
 * const userResult = await fetchUserRecord("user123");
 * if (userResult.success && userResult.data) {
 *   console.log("User found:", userResult.data);
 * } else {
 *   console.error(`Error ${userResult.statusCode}:`, userResult.error);
 * }
 *
 * // List users with pagination
 * const listResult = await listUserRecords({
 *   limit: 10,
 *   filter: { name: { contains: "John" } }
 * });
 * if (listResult.success && listResult.data) {
 *   console.log("Users:", listResult.data.items);
 *   if (listResult.data.nextToken) {
 *     console.log("More users available");
 *   }
 * } else {
 *   console.error(`Error ${listResult.statusCode}:`, listResult.error);
 * }
 *
 * // Create a new user
 * const createResult = await createUserRecord({
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 * if (createResult.success && createResult.data) {
 *   console.log("User created:", createResult.data);
 * } else {
 *   console.error(`Error ${createResult.statusCode}:`, createResult.error);
 * }
 *
 * // Update a user
 * const updateResult = await updateUserRecord("user123", {
 *   name: "John Smith"
 * });
 * if (updateResult.success && updateResult.data) {
 *   console.log("User updated:", updateResult.data);
 * } else {
 *   console.error(`Error ${updateResult.statusCode}:`, updateResult.error);
 * }
 *
 * // Delete a user
 * const deleteResult = await deleteUserRecord("user123");
 * if (deleteResult.success && deleteResult.data) {
 *   console.log("User deleted:", deleteResult.data);
 * } else {
 *   console.error(`Error ${deleteResult.statusCode}:`, deleteResult.error);
 * }
 */
