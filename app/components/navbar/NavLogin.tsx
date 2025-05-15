"use client";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import styles from "./navbarStyles.module.css";
import { useState } from "react";

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
          {({ signOut, user }) => {
            return (
              <main>
                <h1>Hello {user?.signInDetails?.loginId}</h1>
                <button onClick={signOut}>Sign out</button>
              </main>
            );
          }}
        </Authenticator>
      )}
    </>
  );
}
