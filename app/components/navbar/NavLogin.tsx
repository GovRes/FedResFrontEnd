"use client";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import styles from "./navbarStyles.module.css";
import { useState, useEffect } from "react";
import { useUserInitialization } from "@/lib/hooks/useUserInitialization";

// Component that handles the user initialization and authenticated state
function AuthenticatedApp({ onClose }: { onClose: () => void }) {
  console.log("🔍 AuthenticatedApp component rendered!");

  const {
    user: authUser,
    authStatus,
    signOut,
  } = useAuthenticator((context) => [
    context.user,
    context.authStatus,
    context.signOut,
  ]);

  console.log(
    "🔍 AuthenticatedApp render - authStatus:",
    authStatus,
    "authUser:",
    !!authUser
  );

  // Use the new user initialization hook
  const {
    user: dbUser,
    loading: userLoading,
    error: userError,
  } = useUserInitialization();

  console.log(
    "🔍 Hook state - dbUser:",
    !!dbUser,
    "loading:",
    userLoading,
    "error:",
    userError
  );

  const handleSignOut = () => {
    signOut();
    onClose(); // Close the login modal after sign out
  };

  // Show loading state while user is being initialized
  if (userLoading) {
    console.log("⏳ User initialization loading...");
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
    console.error("❌ User initialization error:", userError);
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

  // User is fully initialized and ready
  console.log("✅ User fully initialized:", dbUser);
  return (
    <main>
      <h1>Hello {dbUser?.givenName || authUser?.signInDetails?.loginId}</h1>

      <div style={{ padding: "20px" }}>
        <p style={{ color: "green" }}>✅ Account ready!</p>

        {/* Optional: Show some user info */}
        <div
          style={{
            backgroundColor: "#f8f9fa",
            padding: "10px",
            borderRadius: "5px",
            margin: "10px 0",
            fontSize: "14px",
          }}
        >
          <strong>Profile Info:</strong>
          <br />
          Email: {dbUser?.email}
          <br />
          Name: {dbUser?.givenName} {dbUser?.familyName}
          <br />
          Status: {dbUser?.isActive ? "Active" : "Inactive"}
          <br />
          Groups: {dbUser?.groups?.join(", ") || "None"}
        </div>
      </div>

      <button onClick={handleSignOut}>Sign out</button>
      <button onClick={onClose}>Close</button>
    </main>
  );
}

// This component will be rendered INSIDE the Authenticator when user is authenticated
function AuthenticatedContent({ onClose }: { onClose: () => void }) {
  console.log("🔍 AuthenticatedContent component rendered!");

  // Monitor auth state changes
  useEffect(() => {
    console.log("🔍 AuthenticatedContent mounted - user is authenticated!");
  }, []);

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

  console.log("🔍 Login component rendered, showAuth:", showAuth);

  return (
    <>
      {showAuth && (
        <div>
          <h2>Login Component Rendered</h2>
          <Authenticator
            signUpAttributes={["email", "given_name", "family_name"]}
            components={{
              SignIn: {
                Header() {
                  console.log("🔍 SignIn Header rendered");
                  return <div>Sign In to Your Account</div>;
                },
                Footer() {
                  console.log("🔍 SignIn Footer rendered");
                  return (
                    <div>
                      <button onClick={closeLogin}>Close</button>
                    </div>
                  );
                },
              },
              SignUp: {
                Header() {
                  console.log("🔍 SignUp Header rendered");
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
