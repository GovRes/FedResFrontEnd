// Client-side functions for admin operations and user sync
import { generateClient } from "aws-amplify/data";
import {
  getCurrentUser,
  fetchUserAttributes,
  updateUserAttributes,
} from "aws-amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    const groups =
      (session.tokens?.accessToken?.payload?.["cognito:groups"] as string[]) ||
      [];

    return groups.includes("admins") || groups.includes("superAdmins");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get current user's groups
 */
export async function getCurrentUserGroups(): Promise<string[]> {
  try {
    const session = await fetchAuthSession();
    return (
      (session.tokens?.accessToken?.payload?.["cognito:groups"] as string[]) ||
      []
    );
  } catch (error) {
    console.error("Error getting user groups:", error);
    return [];
  }
}

/**
 * Sync current user's Cognito attributes to GraphQL User record
 * Call this when user updates their profile
 */
export async function syncCurrentUserToGraphQL() {
  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();

    const userData = {
      email: attributes.email || "",
      givenName: attributes.given_name || "",
      familyName: attributes.family_name || "",
      birthdate: attributes.birthdate || undefined,
      gender: attributes.gender || "",
      academicLevel: attributes["custom:academicLevel"] || "",
      currentAgency: attributes["custom:currentAgency"] || "",
      citizen: attributes["custom:citizen"] === "true",
      disabled: attributes["custom:disabled"] === "true",
      fedEmploymentStatus: attributes["custom:fedEmploymentStatus"] || "",
      militarySpouse: attributes["custom:militarySpouse"] === "true",
      veteran: attributes["custom:veteran"] === "true",
    };

    console.log("Attempting to sync user:", user.userId);

    // First, try to get the existing user
    try {
      const { data: existingUser, errors: getErrors } =
        await client.models.User.get({
          id: user.userId,
        });

      if (getErrors && getErrors.length > 0) {
        console.log("No existing user found, will create new one");
      }

      if (existingUser) {
        // User exists, update it
        console.log("Updating existing user");
        const { data: updatedUser, errors: updateErrors } =
          await client.models.User.update({
            id: user.userId,
            ...userData,
          });

        if (updateErrors && updateErrors.length > 0) {
          throw new Error(
            `Failed to update user: ${updateErrors
              .map((e: any) => e.message)
              .join(", ")}`
          );
        }

        console.log("Successfully updated user:", updatedUser?.id);
        return updatedUser;
      } else {
        // User doesn't exist, create it
        console.log("Creating new user");
        const { data: newUser, errors: createErrors } =
          await client.models.User.create({
            id: user.userId,
            ...userData,
          });

        if (createErrors && createErrors.length > 0) {
          throw new Error(
            `Failed to create user: ${createErrors
              .map((e: any) => e.message)
              .join(", ")}`
          );
        }

        console.log("Successfully created user:", newUser?.id);
        return newUser;
      }
    } catch (getError) {
      // If getting user fails, try to create a new one
      console.log("Error getting user, attempting to create:", getError);

      const { data: newUser, errors: createErrors } =
        await client.models.User.create({
          id: user.userId,
          ...userData,
        });

      if (createErrors && createErrors.length > 0) {
        throw new Error(
          `Failed to create user: ${createErrors
            .map((e: any) => e.message)
            .join(", ")}`
        );
      }

      console.log("Successfully created user:", newUser?.id);
      return newUser;
    }
  } catch (error: any) {
    console.error("Error syncing user to GraphQL:", error);
    throw error;
  }
}

/**
 * Admin function: List all users (requires admin group membership)
 */
export async function adminListAllUsers(limit?: number, nextToken?: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("Access denied: Admin privileges required");
  }

  try {
    const {
      data: users,
      errors,
      nextToken: newNextToken,
    } = await client.models.User.list({
      limit,
      nextToken,
    });

    if (errors && errors.length > 0) {
      throw new Error(
        `Failed to list users: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    return { users, nextToken: newNextToken };
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
}

/**
 * Admin function: Get a specific user by ID
 */
export async function adminGetUser(userId: string) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("Access denied: Admin privileges required");
  }

  try {
    const { data: user, errors } = await client.models.User.get({ id: userId });

    if (errors && errors.length > 0) {
      throw new Error(
        `Failed to get user: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

/**
 * Admin function: Update any user's GraphQL record
 */
export async function adminUpdateUser(
  userId: string,
  updates: Partial<Schema["User"]["type"]>
) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("Access denied: Admin privileges required");
  }

  try {
    const { data: user, errors } = await client.models.User.update({
      id: userId,
      ...updates,
    });

    if (errors && errors.length > 0) {
      throw new Error(
        `Failed to update user: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    return user;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}
