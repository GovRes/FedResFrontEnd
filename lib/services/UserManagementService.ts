// src/lib/services/UserManagementService.ts

import { generateClient } from "aws-amplify/data";
import { getCurrentUser, updateUserAttribute } from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";
import type {
  UserProfile,
  UserUpdateData,
  AdminUserUpdate,
} from "@/lib/types/user";

const client = generateClient<Schema>();

// Helper type for safe string arrays
type SafeStringArray = string[] | null | undefined;

class UserManagementService {
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

      // Filter by cognitoUserId to find the current user
      const { data } = await client.models.User.list({
        filter: { cognitoUserId: { eq: currentUser.userId } },
      });

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
   * Get a specific user by their database ID
   */
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data: userData } = await client.models.User.get(
        { id: userId },
        {
          selectionSet: [
            "id",
            "cognitoUserId",
            "email",
            "givenName",
            "familyName",
            "academicLevel",
            "birthdate",
            "citizen",
            "currentAgency",
            "disabled",
            "fedEmploymentStatus",
            "gender",
            "militarySpouse",
            "veteran",
            "isActive",
            "createdAt",
            "updatedAt",
            "userRoles.role.name", // Try to get nested role names
          ],
        }
      );

      if (!userData) {
        return null;
      }

      // Extract role names from the nested data
      const userRoles =
        userData.userRoles?.map((ur) => ur.role?.name).filter(Boolean) || [];

      return {
        id: userData.id,
        owner: userData.cognitoUserId,
        email: userData.email,
        givenName: userData.givenName,
        familyName: userData.familyName,
        academicLevel: userData.academicLevel,
        birthdate: userData.birthdate,
        citizen: userData.citizen,
        currentAgency: userData.currentAgency,
        disabled: userData.disabled,
        fedEmploymentStatus: userData.fedEmploymentStatus,
        gender: userData.gender,
        militarySpouse: userData.militarySpouse,
        veteran: userData.veteran,
        roles: userRoles,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };
    } catch (error) {
      console.error("Error getting user by ID with optimized query:", error);
      // Fallback to the basic approach
      return this.getUserById(userId);
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
  async updateUserRoles(userId: string, newRoles: string[]): Promise<void> {
    try {
      // Get current UserRole relationships for this user
      const { data: currentUserRoles } = await client.models.UserRole.list({
        filter: { userId: { eq: userId } },
      });

      // Get all available roles to map names to IDs
      const { data: allRoles } = await client.models.Role.list();
      const roleMap = new Map(
        allRoles?.map((role) => [role.name, role.id]) || []
      );

      // Convert new role names to role IDs
      const newRoleIds = newRoles
        .map((roleName) => roleMap.get(roleName))
        .filter((roleId): roleId is string => roleId !== undefined);

      // Get current role IDs for comparison
      const currentRoleIds = currentUserRoles?.map((ur) => ur.roleId) || [];

      // Remove roles that are no longer assigned
      const rolesToRemove =
        currentUserRoles?.filter((ur) => !newRoleIds.includes(ur.roleId)) || [];

      for (const userRole of rolesToRemove) {
        await client.models.UserRole.delete({ id: userRole.id });
      }

      // Add new roles that weren't previously assigned
      const rolesToAdd = newRoleIds.filter(
        (roleId) => !currentRoleIds.includes(roleId)
      );

      for (const roleId of rolesToAdd) {
        await client.models.UserRole.create({
          userId: userId,
          roleId: roleId,
          assignedAt: new Date().toISOString(),
          assignedBy: "admin", // You might want to pass the current admin's ID here
        });
      }
    } catch (error) {
      console.error("❌ Error updating user roles:", error);
      throw new Error(
        `Failed to update user roles: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  async assignRoleToUser(userId: string, roleName: string): Promise<boolean> {
    try {
      // First find the role by name
      const { data: roles } = await client.models.Role.list({
        filter: { name: { eq: roleName } },
      });

      if (!roles || roles.length === 0) {
        console.error(`Role '${roleName}' not found`);
        return false;
      }

      const role = roles[0];

      // Check if user already has this role
      const { data: existingUserRoles } = await client.models.UserRole.list({
        filter: {
          and: [{ userId: { eq: userId } }, { roleId: { eq: role.id } }],
        },
      });

      if (existingUserRoles && existingUserRoles.length > 0) {
        return true; // Already assigned
      }

      // Create the UserRole relationship
      await client.models.UserRole.create({
        userId: userId,
        roleId: role.id,
        assignedAt: new Date().toISOString(),
        assignedBy: "admin", // You might want to pass this as a parameter
      });

      return true;
    } catch (error) {
      console.error("Error assigning role to user:", error);
      return false;
    }
  }

  async removeRoleFromUser(userId: string, roleName: string): Promise<boolean> {
    try {
      // First find the role by name
      const { data: roles } = await client.models.Role.list({
        filter: { name: { eq: roleName } },
      });

      if (!roles || roles.length === 0) {
        console.error(`Role '${roleName}' not found`);
        return false;
      }

      const role = roles[0];

      // Find the UserRole relationship
      const { data: userRoles } = await client.models.UserRole.list({
        filter: {
          and: [{ userId: { eq: userId } }, { roleId: { eq: role.id } }],
        },
      });

      if (!userRoles || userRoles.length === 0) {
        return true; // Already removed
      }

      // Delete the UserRole relationship
      for (const userRole of userRoles) {
        await client.models.UserRole.delete({ id: userRole.id });
      }

      return true;
    } catch (error) {
      console.error("Error removing role from user:", error);
      return false;
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
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: AdminUserUpdate): Promise<boolean> {
    try {
      // Separate roles from other user attributes
      const { roles, ...userUpdates } = updates;

      // Update user attributes (excluding roles)
      if (Object.keys(userUpdates).length > 0) {
        // Create properly typed update data
        const updateData = {
          id: userId, // Required field
          updatedAt: new Date().toISOString(),
          // Only include fields that are being updated and are not undefined/system fields
          ...(userUpdates.email !== undefined && { email: userUpdates.email }),
          ...(userUpdates.givenName !== undefined && {
            givenName: userUpdates.givenName,
          }),
          ...(userUpdates.familyName !== undefined && {
            familyName: userUpdates.familyName,
          }),
          ...(userUpdates.academicLevel !== undefined && {
            academicLevel: userUpdates.academicLevel,
          }),
          ...(userUpdates.birthdate !== undefined && {
            birthdate: userUpdates.birthdate,
          }),
          ...(userUpdates.citizen !== undefined && {
            citizen: userUpdates.citizen,
          }),
          ...(userUpdates.currentAgency !== undefined && {
            currentAgency: userUpdates.currentAgency,
          }),
          ...(userUpdates.disabled !== undefined && {
            disabled: userUpdates.disabled,
          }),
          ...(userUpdates.fedEmploymentStatus !== undefined && {
            fedEmploymentStatus: userUpdates.fedEmploymentStatus,
          }),
          ...(userUpdates.gender !== undefined && {
            gender: userUpdates.gender,
          }),
          ...(userUpdates.militarySpouse !== undefined && {
            militarySpouse: userUpdates.militarySpouse,
          }),
          ...(userUpdates.veteran !== undefined && {
            veteran: userUpdates.veteran,
          }),
          ...(userUpdates.isActive !== undefined && {
            isActive: userUpdates.isActive,
          }),
        };

        const { data, errors } = await client.models.User.update(updateData);

        if (errors?.length) {
          console.error("❌ Database update errors:", errors);
          throw new Error(`Update failed: ${errors[0].message}`);
        }
      }

      // Handle role updates if provided
      if (roles !== undefined) {
        await this.updateUserRoles(userId, roles || []);
      }

      // NOTE: We do NOT call syncToCognito here because:
      // 1. This is an admin function for updating OTHER users
      // 2. syncToCognito only works for the currently logged-in user
      // 3. Calling it would incorrectly update the admin's Cognito profile

      return true;
    } catch (error) {
      console.error("❌ Error updating user:", error);
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

  COGNITO_ATTRIBUTE_MAPPING = {
    academicLevel: "custom:academicLevel", // NOT custom:academic_level
    currentAgency: "custom:currentAgency", // NOT custom:current_agency
    citizen: "custom:citizen",
    disabled: "custom:disabled",
    fedEmploymentStatus: "custom:fedEmploymentStatus", // NOT custom:fed_employment_status
    militarySpouse: "custom:militarySpouse", // NOT custom:military_spouse
    veteran: "custom:veteran",
  } as const;

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
      return;
    }

    // Update each field in Cognito
    const updatePromises = Object.entries(cognitoFields).map(
      async ([key, value]) => {
        try {
          await updateUserAttribute({
            userAttribute: { attributeKey: key, value },
          });

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
}

// Export singleton instance
export const userManagementService = new UserManagementService();
