// src/lib/services/UserManagementService.ts

import { generateClient } from "aws-amplify/data";
import {
  getCurrentUser,
  updateUserAttribute,
  fetchUserAttributes,
  deleteUser,
  type AuthUser,
} from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";
import type {
  UserProfile,
  UserUpdateData,
  AdminUserUpdate,
} from "@/lib/types/user";

const client = generateClient<Schema>();

// Helper type for safe string arrays
type SafeStringArray = string[] | null | undefined;

export class UserManagementService {
  // Helper method to safely convert nullable arrays
  private safeStringArray(nullableArray: any): SafeStringArray {
    if (!nullableArray) return null;
    if (Array.isArray(nullableArray)) {
      // Filter out null values and keep only strings
      return nullableArray.filter(
        (item): item is string => item !== null && typeof item === "string"
      );
    }
    return null;
  }

  /**
   * Get current user's profile from database
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const currentUser = await getCurrentUser();
      console.log(41, currentUser);

      // Filter by cognitoUserId to find the current user
      const { data } = await client.models.User.list({
        filter: { cognitoUserId: { eq: currentUser.userId } },
      });
      console.log(44, data);

      if (!data || data.length === 0) {
        return null;
      }

      // Convert Amplify model to UserProfile interface
      const user = data[0];
      return {
        id: user.id,
        owner: user.cognitoUserId, // Use cognitoUserId as owner for compatibility
        email: user.email,
        givenName: user.givenName,
        familyName: user.familyName,
        academicLevel: user.academicLevel,
        birthdate: user.birthdate,
        citizen: user.citizen,
        currentAgency: user.currentAgency,
        disabled: user.disabled,
        fedEmploymentStatus: user.fedEmploymentStatus,
        gender: user.gender,
        militarySpouse: user.militarySpouse,
        veteran: user.veteran,
        groups: this.safeStringArray(user.groups),
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error("Error getting current user profile:", error);
      return null;
    }
  }

  /**
   * Sync user data FROM Cognito TO database
   * Call this when user first logs in or when you want to pull latest Cognito data
   */
  async syncFromCognito(): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      console.log("🔄 Syncing user data from Cognito to database...");
      console.log("👤 Current user:", currentUser.userId);
      console.log("📋 Attributes:", attributes);

      // Check if user exists in database
      const existingProfile = await this.getCurrentUserProfile();
      console.log("🔍 Existing profile:", !!existingProfile);

      const cognitoData = {
        email: attributes.email || currentUser.username,
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
        updatedAt: new Date().toISOString(),
      };

      if (existingProfile) {
        // Update existing user with Cognito data
        console.log("🔄 Updating existing user...");
        const { errors } = await client.models.User.update({
          id: existingProfile.id,
          ...cognitoData,
        });

        if (errors?.length) {
          console.error("❌ Update errors:", errors);
          throw new Error(`Failed to sync from Cognito: ${errors[0].message}`);
        }

        console.log("✅ User data synced from Cognito to database");
      } else {
        // Create new user from Cognito data
        console.log("🔄 Creating new user...");
        console.log("📋 User data to create:", {
          ...cognitoData,
          cognitoUserId: currentUser.userId,
        });

        try {
          const { data, errors } = await client.models.User.create({
            ...cognitoData,
            cognitoUserId: currentUser.userId,
            groups: ["users"],
            isActive: true,
            createdAt: new Date().toISOString(),
          });

          if (errors?.length) {
            console.error("❌ Create errors:", errors);
            // Log the specific error details
            errors.forEach((error, index) => {
              console.error(`Error ${index + 1}:`, {
                message: error.message,
                path: error.path,
                locations: error.locations,
                extensions: error.extensions,
              });
            });
            throw new Error(
              `Failed to create user from Cognito: ${errors[0].message}`
            );
          }

          console.log("✅ User created in database:", data);
        } catch (createError) {
          console.error("❌ Create user failed:", createError);

          // If creation fails due to permissions, let's try a different approach
          if (
            createError instanceof Error &&
            createError.message.includes("Not Authorized")
          ) {
            console.log("🔄 Trying alternative creation method...");

            // Wait a moment for authentication to fully propagate
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Try again
            const { data: retryData, errors: retryErrors } =
              await client.models.User.create({
                ...cognitoData,
                cognitoUserId: currentUser.userId,
                groups: ["users"],
                isActive: true,
                createdAt: new Date().toISOString(),
              });

            if (retryErrors?.length) {
              console.error("❌ Retry also failed:", retryErrors);
              // If still failing, we might need to handle this differently
              console.warn(
                "⚠️ Could not create user in database, but user can still use the app"
              );
              return false; // Return false but don't throw - user can still function
            }

            console.log("✅ User created on retry:", retryData);
          } else {
            throw createError; // Re-throw if it's a different error
          }
        }

        console.log("✅ User created in database from Cognito data");
      }

      return true;
    } catch (error) {
      console.error("❌ Error syncing from Cognito:", error);

      // If it's an authorization error, don't throw - the user can still use the app
      if (error instanceof Error && error.message.includes("Not Authorized")) {
        console.warn(
          "⚠️ Authorization error during user creation - user can continue without database profile"
        );
        return false;
      }

      throw error;
    }
  }

  /**
   * Update current user's profile
   * This updates the database and syncs certain fields to Cognito
   */
  async updateCurrentUserProfile(updates: UserUpdateData): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      const profile = await this.getCurrentUserProfile();

      if (!profile) {
        throw new Error("User profile not found");
      }

      // Create properly typed update data
      const updateData = {
        id: profile.id, // Required field
        updatedAt: new Date().toISOString(),
        // Only include fields that are being updated and are not undefined/system fields
        ...(updates.givenName !== undefined && {
          givenName: updates.givenName,
        }),
        ...(updates.familyName !== undefined && {
          familyName: updates.familyName,
        }),
        ...(updates.academicLevel !== undefined && {
          academicLevel: updates.academicLevel,
        }),
        ...(updates.birthdate !== undefined && {
          birthdate: updates.birthdate,
        }),
        ...(updates.citizen !== undefined && { citizen: updates.citizen }),
        ...(updates.currentAgency !== undefined && {
          currentAgency: updates.currentAgency,
        }),
        ...(updates.disabled !== undefined && { disabled: updates.disabled }),
        ...(updates.fedEmploymentStatus !== undefined && {
          fedEmploymentStatus: updates.fedEmploymentStatus,
        }),
        ...(updates.gender !== undefined && { gender: updates.gender }),
        ...(updates.militarySpouse !== undefined && {
          militarySpouse: updates.militarySpouse,
        }),
        ...(updates.veteran !== undefined && { veteran: updates.veteran }),
        ...(updates.groups !== undefined && {
          groups: Array.isArray(updates.groups)
            ? updates.groups.filter(
                (item): item is string => typeof item === "string"
              )
            : updates.groups,
        }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      };

      // Update database first
      const { data, errors } = await client.models.User.update(updateData);

      if (errors?.length) {
        throw new Error(`Database update failed: ${errors[0].message}`);
      }

      // Sync specific fields back to Cognito
      await this.syncToCognito(updates);

      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  /**
   * Admin function: Get all users
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { data } = await client.models.User.list();

      // Convert Amplify models to UserProfile interfaces
      return data.map((user) => ({
        id: user.id,
        owner: user.cognitoUserId, // Use cognitoUserId as owner
        email: user.email,
        givenName: user.givenName,
        familyName: user.familyName,
        academicLevel: user.academicLevel,
        birthdate: user.birthdate,
        citizen: user.citizen,
        currentAgency: user.currentAgency,
        disabled: user.disabled,
        fedEmploymentStatus: user.fedEmploymentStatus,
        gender: user.gender,
        militarySpouse: user.militarySpouse,
        veteran: user.veteran,
        groups: this.safeStringArray(user.groups),
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  /**
   * Admin function: Update any user
   */
  async updateUser(userId: string, updates: AdminUserUpdate): Promise<boolean> {
    try {
      // Create properly typed update data
      const updateData = {
        id: userId, // Required field
        updatedAt: new Date().toISOString(),
        // Only include fields that are being updated and are not undefined/system fields
        ...(updates.email !== undefined && { email: updates.email }),
        ...(updates.givenName !== undefined && {
          givenName: updates.givenName,
        }),
        ...(updates.familyName !== undefined && {
          familyName: updates.familyName,
        }),
        ...(updates.academicLevel !== undefined && {
          academicLevel: updates.academicLevel,
        }),
        ...(updates.birthdate !== undefined && {
          birthdate: updates.birthdate,
        }),
        ...(updates.citizen !== undefined && { citizen: updates.citizen }),
        ...(updates.currentAgency !== undefined && {
          currentAgency: updates.currentAgency,
        }),
        ...(updates.disabled !== undefined && { disabled: updates.disabled }),
        ...(updates.fedEmploymentStatus !== undefined && {
          fedEmploymentStatus: updates.fedEmploymentStatus,
        }),
        ...(updates.gender !== undefined && { gender: updates.gender }),
        ...(updates.militarySpouse !== undefined && {
          militarySpouse: updates.militarySpouse,
        }),
        ...(updates.veteran !== undefined && { veteran: updates.veteran }),
        ...(updates.groups !== undefined && {
          groups: Array.isArray(updates.groups)
            ? updates.groups.filter(
                (item): item is string => typeof item === "string"
              )
            : updates.groups,
        }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      };

      const { data, errors } = await client.models.User.update(updateData);

      if (errors?.length) {
        throw new Error(`Update failed: ${errors[0].message}`);
      }

      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
   * Admin function: Deactivate user (soft delete)
   */
  async deactivateUser(userId: string): Promise<boolean> {
    try {
      return await this.updateUser(userId, { isActive: false });
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }

  /**
   * Admin function: Delete user completely
   * This removes from database and Cognito
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Get user to find Cognito ID
      const { data: user } = await client.models.User.get({ id: userId });
      if (!user) {
        throw new Error("User not found");
      }

      // Delete from database first
      await client.models.User.delete({ id: userId });

      // Note: Deleting from Cognito requires admin SDK
      // You'll need a separate admin API for this
      console.log(
        `User ${userId} deleted from database. Cognito deletion requires admin API.`
      );

      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  COGNITO_ATTRIBUTE_MAPPING = {
    academicLevel: "custom:academicLevel", // NOT custom:academic_level
    currentAgency: "custom:currentAgency", // NOT custom:current_agency
    citizen: "custom:citizen",
    disabled: "custom:disabled",
    fedEmploymentStatus: "custom:fedEmploymentStatus", // NOT custom:fed_employment_status
    militarySpouse: "custom:militarySpouse", // NOT custom:military_spouse
    veteran: "custom:veteran",
  } as const;

  // Updated sync method using the mapping:
  private async syncToCognito(updates: UserUpdateData): Promise<void> {
    const cognitoFields: Record<string, string> = {};

    // Standard Cognito attributes
    if (updates.givenName !== undefined) {
      cognitoFields.given_name = updates.givenName || "";
    }
    if (updates.familyName !== undefined) {
      cognitoFields.family_name = updates.familyName || "";
    }
    if (updates.gender !== undefined) {
      cognitoFields.gender = updates.gender || "";
    }
    if (updates.birthdate !== undefined) {
      cognitoFields.birthdate = updates.birthdate || "";
    }

    // Custom attributes using exact names from auth config
    if (updates.academicLevel !== undefined) {
      cognitoFields[this.COGNITO_ATTRIBUTE_MAPPING.academicLevel] =
        updates.academicLevel || "";
    }
    if (updates.currentAgency !== undefined) {
      cognitoFields[this.COGNITO_ATTRIBUTE_MAPPING.currentAgency] =
        updates.currentAgency || "";
    }
    if (updates.fedEmploymentStatus !== undefined) {
      cognitoFields[this.COGNITO_ATTRIBUTE_MAPPING.fedEmploymentStatus] =
        updates.fedEmploymentStatus || "";
    }

    // Boolean fields
    if (updates.citizen !== undefined) {
      cognitoFields[this.COGNITO_ATTRIBUTE_MAPPING.citizen] =
        updates.citizen === true ? "true" : "false";
    }
    if (updates.disabled !== undefined) {
      cognitoFields[this.COGNITO_ATTRIBUTE_MAPPING.disabled] =
        updates.disabled === true ? "true" : "false";
    }
    if (updates.militarySpouse !== undefined) {
      cognitoFields[this.COGNITO_ATTRIBUTE_MAPPING.militarySpouse] =
        updates.militarySpouse === true ? "true" : "false";
    }
    if (updates.veteran !== undefined) {
      cognitoFields[this.COGNITO_ATTRIBUTE_MAPPING.veteran] =
        updates.veteran === true ? "true" : "false";
    }
    // Only proceed if there are fields to update
    if (Object.keys(cognitoFields).length === 0) {
      console.log("No Cognito fields to update");
      return;
    }

    console.log("🔄 Syncing to Cognito:", cognitoFields);

    // Update each field in Cognito
    const updatePromises = Object.entries(cognitoFields).map(
      async ([key, value]) => {
        try {
          await updateUserAttribute({
            userAttribute: { attributeKey: key, value },
          });
          console.log(`✅ Updated Cognito attribute ${key}`);
          return { key, success: true };
        } catch (error) {
          console.warn(`❌ Failed to update Cognito attribute ${key}:`, error);
          return { key, success: false, error };
        }
      }
    );

    try {
      const results = await Promise.all(updatePromises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      console.log(
        `✅ Cognito sync completed: ${successful.length} successful, ${failed.length} failed`
      );

      if (failed.length > 0) {
        console.warn(
          "Failed attributes:",
          failed.map((f) => f.key)
        );
      }
    } catch (error) {
      console.warn("⚠️ Error during Cognito sync:", error);
      // Don't throw - database update was successful
    }
  }

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

// Export singleton instance
export const userManagementService = new UserManagementService();
