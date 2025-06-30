"use client";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import styles from "./navbarStyles.module.css";
import { useState, useEffect } from "react";
import { syncCurrentUserToGraphQL } from "@/app/utils/userAdmin";

// Component that handles the sync logic and authenticated state
function AuthenticatedApp({ onClose }: { onClose: () => void }) {
  const { user, authStatus, signOut } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "synced" | "error"
  >("idle");

  useEffect(() => {
    const handleUserSync = async () => {
      // Only sync when user is fully authenticated and haven't synced yet
      if (authStatus === "authenticated" && user && syncStatus === "idle") {
        setSyncStatus("syncing");
        try {
          console.log("User authenticated, syncing to GraphQL...");
          await syncCurrentUserToGraphQL();
          setSyncStatus("synced");
          console.log("User sync completed");
        } catch (error) {
          console.error("Failed to sync user:", error);
          setSyncStatus("error");
          // You might want to retry or show a user-friendly message
        }
      }
    };

    handleUserSync();
  }, [user, authStatus, syncStatus]); // Trigger when user, auth status, or sync status changes

  if (authStatus !== "authenticated") {
    return null; // Authenticator will handle this state
  }

  const handleSignOut = () => {
    signOut();
    onClose(); // Close the login modal after sign out
  };

  return (
    <main>
      <h1>Hello {user?.signInDetails?.loginId}</h1>

      {/* Optional: Show sync status */}
      {syncStatus === "syncing" && <p>Setting up your profile...</p>}
      {syncStatus === "error" && (
        <p style={{ color: "red" }}>
          Profile setup failed. Please refresh or contact support.
        </p>
      )}
      {syncStatus === "synced" && (
        <p style={{ color: "green" }}>Profile ready!</p>
      )}

      <button onClick={handleSignOut}>Sign out</button>
      <button onClick={onClose}>Close</button>
    </main>
  );
}

export default function Login({
  setShowLogin,
}: {
  setShowLogin: (showLogin: boolean) => void;
}) {
  const [showAuth, isShowAuth] = useState(true);

  function closeLogin() {
    setShowLogin(false);
    isShowAuth(false);
  }

  return (
    <>
      {showAuth && (
        <Authenticator
          signUpAttributes={["email", "given_name", "family_name"]}
          components={{
            SignIn: {
              Footer() {
                return (
                  <div>
                    <button onClick={closeLogin}>Close</button>
                  </div>
                );
              },
            },
          }}
          className={styles.login}
        >
          <AuthenticatedApp onClose={closeLogin} />
        </Authenticator>
      )}
    </>
  );
}
