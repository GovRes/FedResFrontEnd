"use client"
import { Authenticator } from '@aws-amplify/ui-react';
import styles from "./loginStyles.module.css";

export default function Login() {

    return (

        <Authenticator signUpAttributes={[
            'email',
            'given_name',
            'family_name',
        ]} className={styles.model}>
            {({ signOut, user }) => {
                console.log(user)
                return (
                    <main>
                        <h1>Hello {user?.signInDetails?.loginId}</h1>
                        <button onClick={signOut}>Sign out</button>

                    </main>
                )
            }}
        </Authenticator>

    )
}