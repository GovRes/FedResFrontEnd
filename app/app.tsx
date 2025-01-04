"use client"
import '@aws-amplify/ui-react/styles.css';
import Header from './components/Header';
import Footer from './components/Footer';
import { AllyProvider } from './providers';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import ConfigureAmplifyClientSide from './ConfigureAmplify';

ConfigureAmplifyClientSide();

export default function App(props: React.PropsWithChildren) {
    return (
        <><Authenticator>
            <Header />
            <AllyProvider>
                <div className="container">{props.children}</div>
            </AllyProvider>
            <Footer />
        </Authenticator>
        </>
    )
}
