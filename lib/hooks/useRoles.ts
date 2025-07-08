import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export interface Role {
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

  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoading(true);
        const response = await client.models.Role.list({
          filter: { isActive: { eq: true } },
        });
        console.log("Fetched roles:", response.data);

        if (response.data) {
          const roleData = response.data.map((role) => ({
            id: role.id,
            name: role.name,
            displayName: role.displayName,
            description: role.description || undefined,
            isActive: role.isActive === null ? false : role.isActive,
          }));
          setRoles(roleData);
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch roles");
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, []);
  const roleOptions = roles.reduce((acc, role) => {
    acc[role.name] = role.displayName;
    return acc;
  }, {} as Record<string, string>);

  return { roles, roleOptions, loading, error };
}
