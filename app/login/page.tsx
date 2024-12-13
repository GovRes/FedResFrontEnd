"use client"
import '@aws-amplify/ui-react/styles.css';

import { Authenticator } from '@aws-amplify/ui-react';
import styles from "./loginStyles.module.css";
import ConfigureAmplifyClientSide from '../ConfigureAmplify';

export default function Login() {

    return (
<>
<ConfigureAmplifyClientSide />
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
            </>

    )
}