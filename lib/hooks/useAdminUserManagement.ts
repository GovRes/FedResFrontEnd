// src/lib/hooks/useAdminUserManagement.ts

import { useState, useEffect } from "react";
import { userManagementService } from "@/lib/services/UserManagementService";
import type { UserProfile, AdminUserUpdate } from "@/lib/types/user";

export function useAdminUserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const allUsers = await userManagementService.getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load users";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (
    userId: string,
    updates: AdminUserUpdate
  ): Promise<boolean> => {
    try {
      setError(null);
      const success = await userManagementService.updateUser(userId, updates);

      if (success) {
        await loadUsers(); // Refresh the list
      }

      return success;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update user";
      setError(errorMessage);
      return false;
    }
  };

  const deactivateUser = async (userId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await userManagementService.deactivateUser(userId);

      if (success) {
        await loadUsers(); // Refresh the list
      }

      return success;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to deactivate user";
      setError(errorMessage);
      return false;
    }
  };
  return {
    users,
    loading,
    error,
    loadUsers,
    updateUser,
    deactivateUser,
  };
}
