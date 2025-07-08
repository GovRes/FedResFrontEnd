// utils/seedRoles.ts
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export interface SeedResult {
  success: boolean;
  message: string;
  details: Array<{
    role: string;
    action: "created" | "existed" | "error";
    error?: string;
  }>;
}

export async function seedRoles(): Promise<SeedResult> {
  const roles = [
    {
      name: "user",
      displayName: "User",
      description: "Basic user access - can view and create applications",
      permissions: [
        "user:read",
        "application:create",
        "application:read",
        "application:update",
        "resume:create",
        "resume:read",
        "education:create",
        "education:read",
      ],
      isActive: true,
    },
    {
      // tk eventually change to only manage in own organization
      name: "admin",
      displayName: "Administrator",
      description: "Full system access - can manage all users and applications",
      permissions: [
        "user:read",
        "user:create",
        "user:update",
        "user:delete",
        "application:create",
        "application:read",
        "application:update",
        "application:delete",
        "application:approve",
        "job:create",
        "job:read",
        "job:update",
        "job:delete",
        "admin:users",
        "admin:roles",
      ],
      isActive: true,
    },
    {
      name: "super_admin",
      displayName: "Super Admin",
      description: "Full system access - can manage all users and applications",
      permissions: [
        "user:read",
        "user:create",
        "user:update",
        "user:delete",
        "application:create",
        "application:read",
        "application:update",
        "application:delete",
        "application:approve",
        "job:create",
        "job:read",
        "job:update",
        "job:delete",
        "admin:users",
        "admin:roles",
      ],
      isActive: true,
    },
  ];

  const result: SeedResult = {
    success: true,
    message: "",
    details: [],
  };

  try {
    for (const roleData of roles) {
      try {
        // Check if role already exists
        const existing = await client.models.Role.list({
          filter: { name: { eq: roleData.name } },
        });

        if (existing.data.length === 0) {
          // Create new role
          await client.models.Role.create(roleData);
          result.details.push({
            role: roleData.name,
            action: "created",
          });
          console.log(`✅ Created role: ${roleData.name}`);
        } else {
          result.details.push({
            role: roleData.name,
            action: "existed",
          });
          console.log(`ℹ️ Role already exists: ${roleData.name}`);
        }
      } catch (error) {
        console.error(`❌ Error processing role ${roleData.name}:`, error);
        result.details.push({
          role: roleData.name,
          action: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        result.success = false;
      }
    }

    const createdCount = result.details.filter(
      (d) => d.action === "created"
    ).length;
    const existedCount = result.details.filter(
      (d) => d.action === "existed"
    ).length;
    const errorCount = result.details.filter(
      (d) => d.action === "error"
    ).length;

    if (errorCount > 0) {
      result.message = `Completed with errors: ${createdCount} created, ${existedCount} existed, ${errorCount} errors`;
    } else {
      result.message = `Success: ${createdCount} roles created, ${existedCount} already existed`;
    }

    return result;
  } catch (error) {
    console.error("❌ Fatal error during role seeding:", error);
    return {
      success: false,
      message: `Fatal error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      details: [],
    };
  }
}

// Also export individual role definitions for reference
export const ROLE_DEFINITIONS = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type RoleName = (typeof ROLE_DEFINITIONS)[keyof typeof ROLE_DEFINITIONS];
