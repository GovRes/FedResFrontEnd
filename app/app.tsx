"use client";
import "@aws-amplify/ui-react/styles.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AllyProvider } from "./providers";

import { Authenticator } from "@aws-amplify/ui-react";
import ConfigureAmplifyClientSide from "./ConfigureAmplify";

// Configure Amplify only once at the app root
ConfigureAmplifyClientSide();

export default function App(props: React.PropsWithChildren) {
  return (
    <Authenticator.Provider>
      <Header />
      <AllyProvider>
        <div className="container">{props.children}</div>
      </AllyProvider>
      <Footer />
    </Authenticator.Provider>
  );
}
