// src/lib/hooks/useUserInitialization.ts
// Hook to ensure user is created and synced when they first log in

import { useEffect, useState } from "react";
import { userManagementService } from "@/lib/services/UserManagementService";
import { getCurrentUser } from "aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { userCreationService } from "../services/UserCreationService";

export function useUserInitialization() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get auth state from useAuthenticator to react to auth changes
  const { user: authUser, authStatus } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
  ]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !authUser) {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    const initializeUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const currentUser = await getCurrentUser();
        const syncSuccess = await userCreationService.ensureUserExists();

        if (syncSuccess) {
          const userData = await userManagementService.getCurrentUserProfile();

          if (userData) {
            setUser(userData);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
          // Don't set this as an error - user can still use the app
        }
      } catch (err) {
        // If user is not authenticated, that's okay - just don't initialize
        if (
          err instanceof Error &&
          (err.message.includes("not authenticated") ||
            err.message.includes("User needs to be authenticated"))
        ) {
          setUser(null);
          setError(null);
        } else {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [authStatus, authUser]); // React to auth state changes

  return { user, loading, error };
}
