// src/lib/hooks/useCurrentUser.ts

import { useState, useEffect } from "react";
import { userManagementService } from "@/lib/services/UserManagementService";
import type { UserProfile, UserUpdateData } from "@/lib/types/user";

export function useCurrentUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: UserUpdateData): Promise<boolean> => {
    try {
      setError(null);
      const success = await userManagementService.updateCurrentUserProfile(
        updates
      );

      if (success) {
        // Refresh profile after successful update
        const updatedProfile =
          await userManagementService.getCurrentUserProfile();
        setProfile(updatedProfile);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Update failed";
      setError(errorMessage);
      return false;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const userProfile = await userManagementService.getCurrentUserProfile();

      setProfile(userProfile);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load profile";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };
}
