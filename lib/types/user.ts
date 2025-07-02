import { generateClient } from "aws-amplify/data";
import {
  getCurrentUser,
  updateUserAttribute,
  deleteUser,
  type AuthUser,
} from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export interface UserProfile {
  id: string;
  owner: string; // This stores the Cognito sub
  email: string;
  givenName?: string;
  familyName?: string;
  academicLevel?: string;
  birthdate?: string;
  citizen?: boolean;
  currentAgency?: string;
  disabled?: boolean;
  fedEmploymentStatus?: string;
  gender?: string;
  militarySpouse?: boolean;
  veteran?: boolean;
  groups: string[];
  isActive: boolean;
}

export class UserManagementService {
  /**
   * Get current user's profile from database
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const currentUser = await getCurrentUser();
      const { data } = await client.models.User.list({
        filter: { owner: { eq: currentUser.userId } },
      });

      return data[0] || null;
    } catch (error) {
      console.error("Error getting current user profile:", error);
      return null;
    }
  }

  /**
   * Update current user's profile
   * This updates the database and syncs certain fields to Cognito
   */
  async updateCurrentUserProfile(
    updates: Partial<UserProfile>
  ): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      const profile = await this.getCurrentUserProfile();

      if (!profile) {
        throw new Error("User profile not found");
      }

      // Update database first
      const { data, errors } = await client.models.User.update({
        id: profile.id,
        ...updates,
        updatedAt: new Date().toISOString(),
      });

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
      return data;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  /**
   * Admin function: Update any user
   */
  async updateUser(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<boolean> {
    try {
      const { data, errors } = await client.models.User.update({
        id: userId,
        ...updates,
        updatedAt: new Date().toISOString(),
      });

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

  /**
   * Sync specific fields to Cognito
   */
  private async syncToCognito(updates: Partial<UserProfile>): Promise<void> {
    const cognitoFields: Record<string, string> = {};

    // Map database fields to Cognito attributes
    if (updates.givenName !== undefined) {
      cognitoFields.given_name = updates.givenName;
    }
    if (updates.familyName !== undefined) {
      cognitoFields.family_name = updates.familyName;
    }
    if (updates.gender !== undefined) {
      cognitoFields.gender = updates.gender;
    }
    if (updates.birthdate !== undefined) {
      cognitoFields.birthdate = updates.birthdate;
    }

    // Update custom attributes
    if (updates.academicLevel !== undefined) {
      cognitoFields["custom:academic_level"] = updates.academicLevel;
    }
    if (updates.currentAgency !== undefined) {
      cognitoFields["custom:current_agency"] = updates.currentAgency;
    }
    if (updates.citizen !== undefined) {
      cognitoFields["custom:citizen"] = updates.citizen.toString();
    }
    if (updates.disabled !== undefined) {
      cognitoFields["custom:disabled"] = updates.disabled.toString();
    }
    if (updates.militarySpouse !== undefined) {
      cognitoFields["custom:military_spouse"] =
        updates.militarySpouse.toString();
    }
    if (updates.veteran !== undefined) {
      cognitoFields["custom:veteran"] = updates.veteran.toString();
    }
    if (updates.fedEmploymentStatus !== undefined) {
      cognitoFields["custom:fed_employment_status"] =
        updates.fedEmploymentStatus;
    }

    // Update each field in Cognito
    const updatePromises = Object.entries(cognitoFields).map(([key, value]) =>
      updateUserAttribute({ userAttribute: { attributeKey: key, value } })
    );

    await Promise.all(updatePromises);
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();
