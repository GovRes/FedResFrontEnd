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
  owner: string | null; // Allow null to match Amplify schema
  email: string;
  givenName?: string | null;
  familyName?: string | null;
  academicLevel?: string | null;
  birthdate?: string | null;
  citizen?: boolean | null;
  currentAgency?: string | null;
  disabled?: boolean | null;
  fedEmploymentStatus?: string | null;
  gender?: string | null;
  militarySpouse?: boolean | null;
  veteran?: boolean | null;
  groups?: string[] | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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

      if (!data || data.length === 0) {
        return null;
      }

      // Convert Amplify model to UserProfile interface
      const user = data[0];
      return {
        id: user.id,
        owner: user.owner,
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
        groups: user.groups,
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
        ...(updates.groups !== undefined && { groups: updates.groups }),
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
        owner: user.owner,
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
        groups: user.groups,
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
  async updateUser(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<boolean> {
    try {
      // Create properly typed update data
      const updateData = {
        id: userId, // Required field
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
        ...(updates.groups !== undefined && { groups: updates.groups }),
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
