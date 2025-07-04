import { generateClient } from "aws-amplify/data";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export class UserCreationService {
  /**
   * Check if current user exists in database, create if not
   * Call this when user first logs in to your app
   */
  async ensureUserExists() {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      console.log("🔍 Checking if user exists in database...");

      // Check if user already exists
      const { data: existingUsers } = await client.models.User.list({
        filter: { cognitoUserId: { eq: currentUser.userId } },
      });

      if (existingUsers && existingUsers.length > 0) {
        console.log("✅ User already exists in database");
        return existingUsers[0];
      }

      // User doesn't exist, create them
      console.log("🔧 Creating user in database...");

      const userData = {
        email: attributes.email || currentUser.username,
        givenName: attributes.given_name || "",
        familyName: attributes.family_name || "",
        groups: ["users"],
        cognitoUserId: currentUser.userId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { data: newUser, errors } = await client.models.User.create(
        userData
      );

      if (errors && errors.length > 0) {
        console.error("❌ Error creating user:", errors);
        throw new Error(`Failed to create user: ${errors[0].message}`);
      }

      console.log("✅ User created successfully:", newUser);
      return newUser;
    } catch (error) {
      console.error("❌ Error in ensureUserExists:", error);
      throw error;
    }
  }

  /**
   * Get current user from database
   */
  async getCurrentUserFromDB() {
    try {
      const currentUser = await getCurrentUser();
      const { data: users } = await client.models.User.list({
        filter: { cognitoUserId: { eq: currentUser.userId } },
      });

      return users && users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error("Error getting current user from DB:", error);
      return null;
    }
  }
}

export const userCreationService = new UserCreationService();
