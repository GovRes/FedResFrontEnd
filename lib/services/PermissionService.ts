// src/lib/services/PermissionService.ts

import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export class PermissionService {
  private userPermissionsCache: Map<string, string[]> = new Map();
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
      const user = await this.getUserProfile(currentUser.userId);
      return user?.roles?.includes(role) || false;
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

      // Combine direct permissions with role-based permissions
      const directPermissions = (user.permissions || []).filter(
        Boolean
      ) as string[];
      const rolePermissions = await this.getRolePermissions(
        (user.roles || []).filter(Boolean) as string[]
      );

      const allPermissions = [
        ...new Set([...directPermissions, ...rolePermissions]),
      ];

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
   * Admin: Assign role to user
   */
  async assignRoleToUser(userId: string, role: string): Promise<boolean> {
    try {
      const { data: user } = await client.models.User.get({ id: userId });
      if (!user) throw new Error("User not found");

      const currentRoles = user.roles || [];
      if (currentRoles.includes(role)) {
        return true; // Already has role
      }

      const updatedRoles = [...currentRoles, role];
      const { errors } = await client.models.User.update({
        id: userId,
        roles: updatedRoles,
        updatedAt: new Date().toISOString(),
      });

      if (errors?.length) {
        throw new Error(`Failed to assign role: ${errors[0].message}`);
      }

      // Clear cache
      if (user.cognitoUserId) {
        this.clearUserCache(user.cognitoUserId);
      }
      return true;
    } catch (error) {
      console.error("Error assigning role:", error);
      throw error;
    }
  }

  /**
   * Admin: Remove role from user
   */
  async removeRoleFromUser(userId: string, role: string): Promise<boolean> {
    try {
      const { data: user } = await client.models.User.get({ id: userId });
      if (!user) throw new Error("User not found");

      const currentRoles = user.roles || [];
      const updatedRoles = currentRoles.filter((r) => r !== role);

      const { errors } = await client.models.User.update({
        id: userId,
        roles: updatedRoles,
        updatedAt: new Date().toISOString(),
      });

      if (errors?.length) {
        throw new Error(`Failed to remove role: ${errors[0].message}`);
      }

      // Clear cache
      if (user.cognitoUserId) {
        this.clearUserCache(user.cognitoUserId);
      }
      return true;
    } catch (error) {
      console.error("Error removing role:", error);
      throw error;
    }
  }

  /**
   * Admin: Grant permission directly to user
   */
  async grantPermissionToUser(
    userId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const { data: user } = await client.models.User.get({ id: userId });
      if (!user) throw new Error("User not found");

      const currentPermissions = user.permissions || [];
      if (currentPermissions.includes(permission)) {
        return true; // Already has permission
      }

      const updatedPermissions = [...currentPermissions, permission];
      const { errors } = await client.models.User.update({
        id: userId,
        permissions: updatedPermissions,
        updatedAt: new Date().toISOString(),
      });

      if (errors?.length) {
        throw new Error(`Failed to grant permission: ${errors[0].message}`);
      }

      // Clear cache
      if (user.cognitoUserId) {
        this.clearUserCache(user.cognitoUserId);
      }
      return true;
    } catch (error) {
      console.error("Error granting permission:", error);
      throw error;
    }
  }

  /**
   * Clear user permission cache
   */
  clearUserCache(cognitoUserId: string): void {
    this.userPermissionsCache.delete(cognitoUserId);
    this.cacheExpiry.delete(cognitoUserId);
  }

  /**
   * Clear all permission caches
   */
  clearAllCaches(): void {
    this.userPermissionsCache.clear();
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
