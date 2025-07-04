// src/lib/hooks/useUserInitialization.ts
// Hook to ensure user is created and synced when they first log in

import { useEffect, useState } from "react";
import { userManagementService } from "@/lib/services/UserManagementService";
import { getCurrentUser } from "aws-amplify/auth";
import { useAuthenticator } from "@aws-amplify/ui-react";

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
    console.log(
      "🔄 useUserInitialization effect triggered - authStatus:",
      authStatus,
      "authUser:",
      !!authUser
    );

    // Only initialize when user is authenticated
    if (authStatus !== "authenticated" || !authUser) {
      console.log("ℹ️ User not authenticated yet, skipping initialization");
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    const initializeUser = async () => {
      try {
        console.log("🚀 Starting user initialization...");
        setLoading(true);
        setError(null);

        // Verify authentication one more time
        console.log("🔍 Double-checking authentication status...");
        const currentUser = await getCurrentUser();
        console.log("✅ User authenticated:", currentUser.userId);

        // First, try to sync from Cognito (this will create user if they don't exist)
        console.log("🔄 Syncing from Cognito...");
        const syncSuccess = await userManagementService.syncFromCognito();

        if (syncSuccess) {
          console.log("✅ Sync from Cognito complete");

          // Then get the user profile from database (now guaranteed to exist)
          console.log("📋 Getting user profile from database...");
          const userData = await userManagementService.getCurrentUserProfile();
          console.log("📋 User profile retrieved:", userData);

          if (userData) {
            setUser(userData);
            console.log("✅ User initialization complete:", userData);
          } else {
            console.log("⚠️ No user profile found, but sync reported success");
            setUser(null);
          }
        } else {
          console.log(
            "⚠️ Sync failed, but user can continue without database profile"
          );
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
          console.log("ℹ️ User not authenticated, skipping initialization");
          setUser(null);
          setError(null);
        } else {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          console.error("❌ User initialization failed:", errorMessage);
          console.error("❌ Full error:", err);
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
        console.log("🏁 User initialization finished");
      }
    };

    initializeUser();
  }, [authStatus, authUser]); // React to auth state changes

  console.log("🔍 Hook state:", { user: !!user, loading, error });

  return { user, loading, error };
}

// Alternative hook that includes refresh functionality
export function useUserInitializationWithRefresh() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeUser = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🚀 Manual user initialization...");

      // Check authentication
      const currentUser = await getCurrentUser();
      console.log("✅ User authenticated:", currentUser.userId);

      // Sync from Cognito to ensure user exists and is up to date
      await userManagementService.syncFromCognito();

      // Get the user profile
      const userData = await userManagementService.getCurrentUserProfile();

      if (!userData) {
        throw new Error("Failed to create or retrieve user profile");
      }

      setUser(userData);
      console.log("✅ Manual user initialization complete:", userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Manual user initialization failed:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("🔄 useUserInitializationWithRefresh effect triggered");
    initializeUser();
  }, []);

  // Return refresh function for manual retry
  return {
    user,
    loading,
    error,
    refresh: initializeUser,
  };
}
