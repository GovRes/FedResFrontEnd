import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { useRole } from "./usePermissions";

const client = generateClient<Schema>();

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
}

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasRole, loading: roleCheckLoading } = useRole("super_admin");

  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoading(true);
        const response = await client.models.Role.list({
          filter: { isActive: { eq: true } },
        });
        if (response.data) {
          let roleData = response.data.map((role) => ({
            id: role.id,
            name: role.name,
            displayName: role.displayName,
            description: role.description || undefined,
            isActive: role.isActive === null ? false : role.isActive,
          }));

          // Filter out super_admin role if user doesn't have super_admin role
          // Only filter after role check is complete
          // if (!roleCheckLoading) {
          //   if (!hasRole) {
          //     roleData = roleData.filter((role) => role.name !== "super_admin");
          //   }
          // }

          setRoles(roleData);
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch roles");
      } finally {
        // Only set loading to false if role check is also complete
        if (!roleCheckLoading) {
          setLoading(false);
        }
      }
    }

    // Only fetch roles when role check is complete
    if (!roleCheckLoading) {
      fetchRoles();
    }
  }, [hasRole, roleCheckLoading]); // Re-run when hasRole or roleCheckLoading changes

  // Update loading state when role check completes
  useEffect(() => {
    if (!roleCheckLoading && loading) {
      setLoading(false);
    }
  }, [roleCheckLoading, loading]);

  const roleOptions = roles.reduce(
    (acc, role) => {
      acc[role.name] = role.displayName;
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    roles,
    roleOptions,
    loading: loading || roleCheckLoading, // Show loading until both are complete
    error,
  };
}
