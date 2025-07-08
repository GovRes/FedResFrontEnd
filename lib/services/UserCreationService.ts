import { generateClient } from "aws-amplify/data";
import { getCurrentUser, fetchUserAttributes } from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export class UserCreationService {
  /**
   * Check if current user exists in database, create if not
   * Call this when user first logs in to your app
   * This replaces the need for syncFromCognito in most cases
   */
  async ensureUserExists() {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      console.log("🔍 Checking if user exists in database...");
      console.log("👤 Cognito User ID:", currentUser.userId);
      console.log("📧 Email:", attributes.email || currentUser.username);

      // Check BOTH by Cognito ID AND by email to prevent any duplicates
      const userEmail = attributes.email || currentUser.username;

      // First check by Cognito ID
      const { data: existingUsersByCognito } = await client.models.User.list({
        filter: { cognitoUserId: { eq: currentUser.userId } },
      });

      if (existingUsersByCognito && existingUsersByCognito.length > 0) {
        console.log("✅ User already exists in database (by Cognito ID)");
        return existingUsersByCognito[0];
      }

      // Also check by email to catch any edge cases
      const { data: existingUsersByEmail } = await client.models.User.list({
        filter: { email: { eq: userEmail } },
      });

      if (existingUsersByEmail && existingUsersByEmail.length > 0) {
        console.log("⚠️ Found user with same email but different Cognito ID");
        console.log("🔄 Updating existing user's Cognito ID...");

        const existingUser = existingUsersByEmail[0];

        // Update the existing user's Cognito ID
        const { data: updatedUser, errors } = await client.models.User.update({
          id: existingUser.id,
          cognitoUserId: currentUser.userId,
          // Also update with latest Cognito data
          email: userEmail,
          givenName: attributes.given_name || existingUser.givenName || "",
          familyName: attributes.family_name || existingUser.familyName || "",
          gender: attributes.gender || existingUser.gender,
          birthdate: attributes.birthdate || existingUser.birthdate,
          academicLevel:
            attributes["custom:academic_level"] || existingUser.academicLevel,
          currentAgency:
            attributes["custom:current_agency"] || existingUser.currentAgency,
          citizen:
            this.convertToBoolean(attributes["custom:citizen"]) ??
            existingUser.citizen,
          disabled:
            this.convertToBoolean(attributes["custom:disabled"]) ??
            existingUser.disabled,
          militarySpouse:
            this.convertToBoolean(attributes["custom:military_spouse"]) ??
            existingUser.militarySpouse,
          veteran:
            this.convertToBoolean(attributes["custom:veteran"]) ??
            existingUser.veteran,
          fedEmploymentStatus:
            attributes["custom:fed_employment_status"] ||
            existingUser.fedEmploymentStatus,
          updatedAt: new Date().toISOString(),
        });

        if (errors && errors.length > 0) {
          console.error("❌ Error updating existing user:", errors);
          throw new Error(`Failed to update user: ${errors[0].message}`);
        }

        console.log("✅ Updated existing user with new Cognito ID");
        return updatedUser;
      }

      // User doesn't exist, create them
      console.log("🔧 Creating new user in database...");

      const userData = {
        email: userEmail,
        givenName: attributes.given_name || "",
        familyName: attributes.family_name || "",
        gender: attributes.gender || null,
        birthdate: attributes.birthdate || null,
        // Custom attributes
        academicLevel: attributes["custom:academic_level"] || null,
        currentAgency: attributes["custom:current_agency"] || null,
        citizen: this.convertToBoolean(attributes["custom:citizen"]),
        disabled: this.convertToBoolean(attributes["custom:disabled"]),
        militarySpouse: this.convertToBoolean(
          attributes["custom:military_spouse"]
        ),
        veteran: this.convertToBoolean(attributes["custom:veteran"]),
        fedEmploymentStatus: attributes["custom:fed_employment_status"] || null,
        groups: ["users"],
        cognitoUserId: currentUser.userId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("📋 Creating user with data:", userData);

      const { data: newUser, errors } = await client.models.User.create(
        userData
      );

      if (errors && errors.length > 0) {
        console.error("❌ Error creating user:", errors);

        // Check if it's a duplicate error (race condition)
        if (
          errors[0].message.includes("duplicate") ||
          errors[0].message.includes("already exists")
        ) {
          console.log("🔄 Race condition detected, fetching existing user...");
          // Try to fetch the user that was just created
          const { data: raceConditionUser } = await client.models.User.list({
            filter: { cognitoUserId: { eq: currentUser.userId } },
          });

          if (raceConditionUser && raceConditionUser.length > 0) {
            console.log("✅ Found user created by race condition");
            return raceConditionUser[0];
          }
        }

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

  /**
   * Helper method to safely convert string values to boolean
   */
  private convertToBoolean(value: any): boolean | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true" || lower === "1" || lower === "yes") return true;
      if (lower === "false" || lower === "0" || lower === "no") return false;
    }
    if (typeof value === "number") return value !== 0;
    return null;
  }
}

export const userCreationService = new UserCreationService();
