"use client";
import "@aws-amplify/ui-react/styles.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Authenticator } from "@aws-amplify/ui-react";
import ConfigureAmplifyClientSide from "./ConfigureAmplify";

// Configure Amplify only once at the app root
ConfigureAmplifyClientSide();

export default function App(props: React.PropsWithChildren) {
  return (
    <Authenticator.Provider>
      <Header />
      <div className="container">{props.children}</div>
      <Footer />
    </Authenticator.Provider>
  );
}
