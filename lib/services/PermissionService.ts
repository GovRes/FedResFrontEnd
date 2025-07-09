// src/lib/services/PermissionService.ts

import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export class PermissionService {
  private userPermissionsCache: Map<string, string[]> = new Map();
  private userRolesCache: Map<string, string[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if current user has a specific permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      const permissions = await this.getUserPermissions(currentUser.userId);
      return permissions.includes(permission);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  /**
   * Check if current user has any of the specified permissions
   */
  async hasAnyPermission(permissions: string[]): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      const userPermissions = await this.getUserPermissions(currentUser.userId);
      return permissions.some((permission) =>
        userPermissions.includes(permission)
      );
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  }

  /**
   * Check if current user has a specific role
   */
  async hasRole(role: string): Promise<boolean> {
    try {
      const currentUser = await getCurrentUser();
      const userRoles = await this.getUserRoles(currentUser.userId);
      return userRoles.includes(role);
    } catch (error) {
      console.error("Error checking role:", error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(cognitoUserId: string): Promise<string[]> {
    // Check cache first
    const cached = this.userPermissionsCache.get(cognitoUserId);
    const cacheTime = this.cacheExpiry.get(cognitoUserId);

    if (cached && cacheTime && Date.now() < cacheTime) {
      return cached;
    }

    try {
      const user = await this.getUserProfile(cognitoUserId);
      if (!user || !user.isActive) {
        return [];
      }

      // Get user's roles through UserRole relationships
      const userRoles = await this.getUserRoles(cognitoUserId);

      // Get permissions from roles
      const rolePermissions = await this.getRolePermissions(userRoles);

      // Note: Direct permissions on User are removed since we're using relationship-based roles
      // If you still want direct permissions on users, you can add them back here
      const allPermissions = [...new Set([...rolePermissions])];

      // Cache the result
      this.userPermissionsCache.set(cognitoUserId, allPermissions);
      this.cacheExpiry.set(cognitoUserId, Date.now() + this.CACHE_DURATION);

      return allPermissions;
    } catch (error) {
      console.error("Error getting user permissions:", error);
      return [];
    }
  }

  /**
   * Get all roles for a user through UserRole relationships
   */
  async getUserRoles(cognitoUserId: string): Promise<string[]> {
    // Check cache first
    const cached = this.userRolesCache.get(cognitoUserId);
    const cacheTime = this.cacheExpiry.get(cognitoUserId);

    if (cached && cacheTime && Date.now() < cacheTime) {
      return cached;
    }

    try {
      const user = await this.getUserProfile(cognitoUserId);
      if (!user || !user.isActive) {
        return [];
      }

      // Get UserRole relationships for this user
      const { data: userRoles } = await client.models.UserRole.list({
        filter: { userId: { eq: user.id } },
      });

      if (!userRoles || userRoles.length === 0) {
        return [];
      }

      // Get role names by fetching each role
      const rolePromises = userRoles.map(async (userRole) => {
        if (userRole.roleId) {
          const { data: roleData } = await client.models.Role.get({
            id: userRole.roleId,
          });
          return roleData?.name || null;
        }
        return null;
      });

      const roleNames = await Promise.all(rolePromises);
      const validRoleNames = roleNames.filter(
        (name): name is string => name !== null
      );

      // Cache the result
      this.userRolesCache.set(cognitoUserId, validRoleNames);
      this.cacheExpiry.set(cognitoUserId, Date.now() + this.CACHE_DURATION);

      return validRoleNames;
    } catch (error) {
      console.error("Error getting user roles:", error);
      return [];
    }
  }

  /**
   * Get permissions from roles
   */
  private async getRolePermissions(roleNames: string[]): Promise<string[]> {
    if (!roleNames.length) return [];

    try {
      // Fetch all active roles and filter them in memory
      const { data: roles } = await client.models.Role.list({
        filter: { isActive: { eq: true } },
      });

      const filteredRoles = roles.filter(
        (role) => role.name && roleNames.includes(role.name)
      );
      const permissions: string[] = [];
      filteredRoles.forEach((role) => {
        if (role.permissions) {
          permissions.push(...(role.permissions.filter(Boolean) as string[]));
        }
      });
      return [...new Set(permissions)]; // Remove duplicates
    } catch (error) {
      console.error("Error getting role permissions:", error);
      return [];
    }
  }

  /**
   * Get user profile
   */
  private async getUserProfile(cognitoUserId: string) {
    try {
      const { data } = await client.models.User.list({
        filter: { cognitoUserId: { eq: cognitoUserId } },
      });
      return data[0] || null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  /**
   * Admin: Assign role to user through UserRole relationship
   */
  async assignRoleToUser(userId: string, roleName: string): Promise<boolean> {
    try {
      // Find the role by name
      const { data: roles } = await client.models.Role.list({
        filter: { name: { eq: roleName } },
      });

      if (!roles || roles.length === 0) {
        throw new Error(`Role '${roleName}' not found`);
      }

      const role = roles[0];

      // Check if user already has this role
      const { data: existingUserRoles } = await client.models.UserRole.list({
        filter: {
          and: [{ userId: { eq: userId } }, { roleId: { eq: role.id } }],
        },
      });

      if (existingUserRoles && existingUserRoles.length > 0) {
        return true; // Already has role
      }

      // Create the UserRole relationship
      const { errors } = await client.models.UserRole.create({
        userId: userId,
        roleId: role.id,
        assignedAt: new Date().toISOString(),
        assignedBy: "admin",
      });

      if (errors?.length) {
        throw new Error(`Failed to assign role: ${errors[0].message}`);
      }

      // Clear cache for this user
      const { data: user } = await client.models.User.get({ id: userId });
      if (user?.cognitoUserId) {
        this.clearUserCache(user.cognitoUserId);
      }

      return true;
    } catch (error) {
      console.error("Error assigning role:", error);
      throw error;
    }
  }

  /**
   * Admin: Remove role from user through UserRole relationship
   */
  async removeRoleFromUser(userId: string, roleName: string): Promise<boolean> {
    try {
      // Find the role by name
      const { data: roles } = await client.models.Role.list({
        filter: { name: { eq: roleName } },
      });

      if (!roles || roles.length === 0) {
        throw new Error(`Role '${roleName}' not found`);
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

      // Delete the UserRole relationship(s)
      for (const userRole of userRoles) {
        const { errors } = await client.models.UserRole.delete({
          id: userRole.id,
        });
        if (errors?.length) {
          throw new Error(`Failed to remove role: ${errors[0].message}`);
        }
      }

      // Clear cache for this user
      const { data: user } = await client.models.User.get({ id: userId });
      if (user?.cognitoUserId) {
        this.clearUserCache(user.cognitoUserId);
      }

      return true;
    } catch (error) {
      console.error("Error removing role:", error);
      throw error;
    }
  }

  /**
   * Admin: Update all roles for a user (used by the admin interface)
   */
  async updateUserRoles(
    userId: string,
    newRoleNames: string[]
  ): Promise<boolean> {
    try {
      // Get current roles
      const { data: currentUserRoles } = await client.models.UserRole.list({
        filter: { userId: { eq: userId } },
      });

      // Get all available roles to map names to IDs
      const { data: allRoles } = await client.models.Role.list();
      const roleMap = new Map(
        allRoles?.map((role) => [role.name, role.id]) || []
      );

      // Convert new role names to role IDs
      const newRoleIds = newRoleNames
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
          assignedBy: "admin",
        });
      }

      // Clear cache for this user
      const { data: user } = await client.models.User.get({ id: userId });
      if (user?.cognitoUserId) {
        this.clearUserCache(user.cognitoUserId);
      }

      return true;
    } catch (error) {
      console.error("Error updating user roles:", error);
      throw error;
    }
  }

  /**
   * Clear user permission and role cache
   */
  clearUserCache(cognitoUserId: string): void {
    this.userPermissionsCache.delete(cognitoUserId);
    this.userRolesCache.delete(cognitoUserId);
    this.cacheExpiry.delete(cognitoUserId);
  }

  /**
   * Clear all permission caches
   */
  clearAllCaches(): void {
    this.userPermissionsCache.clear();
    this.userRolesCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get all available roles
   */
  async getAllRoles() {
    try {
      const { data } = await client.models.Role.list({
        filter: { isActive: { eq: true } },
      });
      return data;
    } catch (error) {
      console.error("Error getting roles:", error);
      return [];
    }
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    try {
      const { data } = await client.models.Permission.list({
        filter: { isActive: { eq: true } },
      });
      return data;
    } catch (error) {
      console.error("Error getting permissions:", error);
      return [];
    }
  }

  /**
   * Get user's roles with full role objects (useful for admin interfaces)
   */
  async getUserRolesWithDetails(userId: string): Promise<any[]> {
    try {
      // Get UserRole relationships for this user
      const { data: userRoles } = await client.models.UserRole.list({
        filter: { userId: { eq: userId } },
      });

      if (!userRoles || userRoles.length === 0) {
        return [];
      }

      // Get full role details
      const rolePromises = userRoles.map(async (userRole) => {
        if (userRole.roleId) {
          const { data: roleData } = await client.models.Role.get({
            id: userRole.roleId,
          });
          return {
            ...roleData,
            assignedAt: userRole.assignedAt,
            assignedBy: userRole.assignedBy,
          };
        }
        return null;
      });

      const roles = await Promise.all(rolePromises);
      return roles.filter((role): role is any => role !== null);
    } catch (error) {
      console.error("Error getting user roles with details:", error);
      return [];
    }
  }
}

export const permissionService = new PermissionService();

// Predefined permissions for your app
export const PERMISSIONS = {
  // User management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_ADMIN: "user:admin",

  // Application management
  APPLICATION_CREATE: "application:create",
  APPLICATION_READ: "application:read",
  APPLICATION_UPDATE: "application:update",
  APPLICATION_DELETE: "application:delete",
  APPLICATION_APPROVE: "application:approve",
  APPLICATION_REVIEW: "application:review",

  // Job management
  JOB_CREATE: "job:create",
  JOB_READ: "job:read",
  JOB_UPDATE: "job:update",
  JOB_DELETE: "job:delete",
  JOB_PUBLISH: "job:publish",

  // Admin functions
  ADMIN_PANEL: "admin:panel",
  ADMIN_ROLES: "admin:roles",
  ADMIN_PERMISSIONS: "admin:permissions",
  ADMIN_SYSTEM: "admin:system",
} as const;
