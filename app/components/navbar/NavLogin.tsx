"use client";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import styles from "./navbarStyles.module.css";
import { useState } from "react";
import { useUserInitialization } from "@/lib/hooks/useUserInitialization";

// Component that handles the user initialization and authenticated state
function AuthenticatedApp({ onClose }: { onClose: () => void }) {
  const { user: authUser, signOut } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);
  // Use the new user initialization hook
  const {
    user: dbUser,
    loading: userLoading,
    error: userError,
  } = useUserInitialization();
  const handleSignOut = () => {
    signOut();
    onClose(); // Close the login modal after sign out
  };

  // Show loading state while user is being initialized
  if (userLoading) {
    return (
      <main>
        <h1>Welcome {authUser?.signInDetails?.loginId}</h1>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>Setting up your account...</p>
          <div>⏳ Please wait while we prepare your profile</div>
        </div>
        <button onClick={handleSignOut}>Sign out</button>
        <button onClick={onClose}>Close</button>
      </main>
    );
  }

  // Show error state if user initialization failed
  if (userError) {
    return (
      <main>
        <h1>Welcome {authUser?.signInDetails?.loginId}</h1>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ color: "red" }}>❌ Account setup failed: {userError}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              margin: "10px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
        <button onClick={handleSignOut}>Sign out</button>
        <button onClick={onClose}>Close</button>
      </main>
    );
  }

  return (
    <main>
      <h1>Hello {dbUser?.givenName || authUser?.signInDetails?.loginId}</h1>
      <button onClick={handleSignOut}>Sign out</button>
      <button onClick={onClose}>Close</button>
    </main>
  );
}
function AuthenticatedContent({ onClose }: { onClose: () => void }) {
  return <AuthenticatedApp onClose={onClose} />;
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
        <div>
          <Authenticator
            signUpAttributes={["email", "given_name", "family_name"]}
            components={{
              SignIn: {
                Header() {
                  return <div>Sign In to Your Account</div>;
                },
                Footer() {
                  return (
                    <div>
                      <button onClick={closeLogin}>Close</button>
                    </div>
                  );
                },
              },
              SignUp: {
                Header() {
                  return <div>Create Your Account</div>;
                },
              },
            }}
            className={styles.login}
          >
            {/* This should render when user is authenticated */}
            <AuthenticatedContent onClose={closeLogin} />
          </Authenticator>
        </div>
      )}
    </>
  );
}
