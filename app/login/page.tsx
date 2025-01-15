"use client"
import '@aws-amplify/ui-react/styles.css';
import { Authenticator } from '@aws-amplify/ui-react';

export default function Login() {
    return (
        <Authenticator
            signUpAttributes={[
                'email',
                'given_name',
                'family_name',
            ]}
        >
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