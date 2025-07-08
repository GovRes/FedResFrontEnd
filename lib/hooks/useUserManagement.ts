// src/lib/hooks/useUserManagement.ts

import { useState, useEffect, useCallback } from "react";
import { userManagementService } from "@/lib/services/UserManagementService";
import type { UserProfile, AdminUserUpdate } from "@/lib/types/user";

interface UseUserManagementProps {
  cognitoUserId?: string;
  autoLoad?: boolean; // Whether to automatically load the user on mount
}

interface UseUserManagementReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  allUsers: UserProfile[];
  allUsersLoading: boolean;
  allUsersError: string | null;

  // Single user operations
  loadUser: (cognitoUserId: string) => Promise<void>;
  loadUserById: (databaseUserId: string) => Promise<void>;
  updateUser: (updates: AdminUserUpdate) => Promise<boolean>;
  deactivateUser: () => Promise<boolean>;
  deleteUser: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  clearUser: () => void;

  // Multiple users operations
  loadAllUsers: () => Promise<void>;
  refreshAllUsers: () => Promise<void>;
  updateAnyUser: (userId: string, updates: AdminUserUpdate) => Promise<boolean>;
  deactivateAnyUser: (userId: string) => Promise<boolean>;
  deleteAnyUser: (userId: string) => Promise<boolean>;
}

export function useUserManagement({
  cognitoUserId,
  autoLoad = true,
}: UseUserManagementProps = {}): UseUserManagementReturn {
  // Single user state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCognitoUserId, setCurrentCognitoUserId] = useState<
    string | undefined
  >(cognitoUserId);
  const [currentDatabaseUserId, setCurrentDatabaseUserId] = useState<
    string | undefined
  >();

  // All users state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [allUsersError, setAllUsersError] = useState<string | null>(null);

  // Helper function to find user by Cognito ID
  const findUserByCognitoId = useCallback(
    async (cognitoId: string): Promise<UserProfile | null> => {
      try {
        const users = await userManagementService.getAllUsers();
        const user = users.find((u) => u.owner === cognitoId);
        return user || null;
      } catch (err) {
        console.error("Error finding user by Cognito ID:", err);
        return null;
      }
    },
    []
  );

  // Load a specific user by database ID
  const loadUserById = useCallback(
    async (databaseUserId: string): Promise<void> => {
      console.log("Loading user with database ID:", databaseUserId);
      try {
        setLoading(true);
        setError(null);
        setCurrentDatabaseUserId(databaseUserId);
        setCurrentCognitoUserId(undefined); // Clear cognito ID since we're using DB ID

        // Use the getUserById method that we need to add to the service
        const userProfile = await userManagementService.getUserById(
          databaseUserId
        );
        console.log("Loaded user profile:", userProfile);
        setProfile(userProfile);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load user";
        console.error("Error loading user by ID:", errorMessage);
        setError(errorMessage);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load a specific user by Cognito ID
  const loadUser = useCallback(
    async (cognitoId: string): Promise<void> => {
      console.log("Loading user with Cognito ID:", cognitoId);
      try {
        setLoading(true);
        setError(null);
        setCurrentCognitoUserId(cognitoId);
        setCurrentDatabaseUserId(undefined); // Clear DB ID since we're using Cognito ID

        const userProfile = await findUserByCognitoId(cognitoId);
        console.log("Loaded user profile:", userProfile);
        setProfile(userProfile);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load user";
        console.error("Error loading user:", errorMessage);
        setError(errorMessage);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    },
    [findUserByCognitoId]
  );

  // Update the current user
  const updateUser = useCallback(
    async (updates: AdminUserUpdate): Promise<boolean> => {
      if (!profile) {
        setError("No user loaded to update");
        return false;
      }

      console.log("Updating user with data:", updates);
      try {
        setError(null);
        const success = await userManagementService.updateUser(
          profile.id,
          updates
        );

        if (success) {
          // Refresh the user profile after successful update
          await refreshUser();
        }

        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Update failed";
        console.error("Error updating user:", errorMessage);
        setError(errorMessage);
        return false;
      }
    },
    [profile]
  );

  // Deactivate the current user
  const deactivateUser = useCallback(async (): Promise<boolean> => {
    if (!profile) {
      setError("No user loaded to deactivate");
      return false;
    }

    console.log("Deactivating user:", profile.id);
    try {
      setError(null);
      const success = await userManagementService.deactivateUser(profile.id);

      if (success) {
        // Refresh the specific user we just deactivated
        if (currentDatabaseUserId) {
          await loadUserById(currentDatabaseUserId);
        } else if (currentCognitoUserId) {
          await loadUser(currentCognitoUserId);
        } else {
          await loadUserById(profile.id);
        }
      }

      return success;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Deactivation failed";
      console.error("Error deactivating user:", errorMessage);
      setError(errorMessage);
      return false;
    }
  }, [
    profile,
    currentDatabaseUserId,
    currentCognitoUserId,
    loadUserById,
    loadUser,
  ]);

  // Delete the current user
  const deleteUser = useCallback(async (): Promise<boolean> => {
    if (!profile) {
      setError("No user loaded to delete");
      return false;
    }

    console.log("Deleting user:", profile.id);
    try {
      setError(null);
      const success = await userManagementService.deleteUser(profile.id);

      if (success) {
        // Clear the profile after successful deletion
        setProfile(null);
        setCurrentCognitoUserId(undefined);
        setCurrentDatabaseUserId(undefined);
      }

      return success;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Deletion failed";
      console.error("Error deleting user:", errorMessage);
      setError(errorMessage);
      return false;
    }
  }, [profile]);

  // Refresh the current user
  const refreshUser = useCallback(async (): Promise<void> => {
    if (currentDatabaseUserId) {
      await loadUserById(currentDatabaseUserId);
    } else if (currentCognitoUserId) {
      await loadUser(currentCognitoUserId);
    } else {
      setError("No user ID to refresh");
    }
  }, [currentCognitoUserId, currentDatabaseUserId, loadUser, loadUserById]);

  // Clear the current user
  const clearUser = useCallback((): void => {
    setProfile(null);
    setCurrentCognitoUserId(undefined);
    setCurrentDatabaseUserId(undefined);
    setError(null);
    setLoading(false);
  }, []);

  // Load all users
  const loadAllUsers = useCallback(async (): Promise<void> => {
    console.log("Loading all users");
    try {
      setAllUsersLoading(true);
      setAllUsersError(null);

      const users = await userManagementService.getAllUsers();
      console.log("Loaded all users:", users.length);
      setAllUsers(users);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load users";
      console.error("Error loading all users:", errorMessage);
      setAllUsersError(errorMessage);
      setAllUsers([]);
    } finally {
      setAllUsersLoading(false);
    }
  }, []);

  // Refresh all users
  const refreshAllUsers = useCallback(async (): Promise<void> => {
    await loadAllUsers();
  }, [loadAllUsers]);

  // Update any user by their database ID
  const updateAnyUser = useCallback(
    async (userId: string, updates: AdminUserUpdate): Promise<boolean> => {
      console.log("Updating user:", userId, "with data:", updates);
      try {
        setAllUsersError(null);
        const success = await userManagementService.updateUser(userId, updates);

        if (success) {
          // Refresh all users to get the updated data
          await refreshAllUsers();

          // If the updated user is the currently loaded user, refresh it too
          if (profile && profile.id === userId) {
            await refreshUser();
          }
        }

        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Update failed";
        console.error("Error updating user:", errorMessage);
        setAllUsersError(errorMessage);
        return false;
      }
    },
    [profile, refreshAllUsers, refreshUser]
  );

  // Deactivate any user by their database ID
  const deactivateAnyUser = useCallback(
    async (userId: string): Promise<boolean> => {
      console.log("Deactivating user:", userId);
      try {
        setAllUsersError(null);
        const success = await userManagementService.deactivateUser(userId);

        if (success) {
          // Refresh all users to get the updated data
          await refreshAllUsers();

          // If the deactivated user is the currently loaded user, refresh it too
          if (profile && profile.id === userId) {
            await refreshUser();
          }
        }

        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Deactivation failed";
        console.error("Error deactivating user:", errorMessage);
        setAllUsersError(errorMessage);
        return false;
      }
    },
    [profile, refreshAllUsers, refreshUser]
  );

  // Delete any user by their database ID
  const deleteAnyUser = useCallback(
    async (userId: string): Promise<boolean> => {
      console.log("Deleting user:", userId);
      try {
        setAllUsersError(null);
        const success = await userManagementService.deleteUser(userId);

        if (success) {
          // Refresh all users to get the updated data
          await refreshAllUsers();

          // If the deleted user is the currently loaded user, clear it
          if (profile && profile.id === userId) {
            clearUser();
          }
        }

        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Deletion failed";
        console.error("Error deleting user:", errorMessage);
        setAllUsersError(errorMessage);
        return false;
      }
    },
    [profile, refreshAllUsers, clearUser]
  );

  // Auto-load user on mount if cognitoUserId is provided
  useEffect(() => {
    if (autoLoad && cognitoUserId && cognitoUserId !== currentCognitoUserId) {
      loadUser(cognitoUserId);
    }
  }, [autoLoad, cognitoUserId, currentCognitoUserId, loadUser]);

  return {
    // Single user state
    profile,
    loading,
    error,

    // All users state
    allUsers,
    allUsersLoading,
    allUsersError,

    // Single user operations
    loadUser,
    loadUserById,
    updateUser,
    deactivateUser,
    deleteUser,
    refreshUser,
    clearUser,

    // Multiple users operations
    loadAllUsers,
    refreshAllUsers,
    updateAnyUser,
    deactivateAnyUser,
    deleteAnyUser,
  };
}
