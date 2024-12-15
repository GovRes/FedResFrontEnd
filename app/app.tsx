"use client"
import '@aws-amplify/ui-react/styles.css';

import Header from './components/Header';
import Footer from './components/Footer';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import ConfigureAmplifyClientSide from './ConfigureAmplify';

export default function App(props: React.PropsWithChildren) {
    return (
        <><Authenticator>
            <ConfigureAmplifyClientSide />

            <Header />
            <div className="container">{props.children}</div>

            <Footer />
        </Authenticator>
        </>
    )
}