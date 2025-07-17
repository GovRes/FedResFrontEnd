"use client";
import "../lib/amplify-config";
import "@aws-amplify/ui-react/styles.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Authenticator } from "@aws-amplify/ui-react";

export default function App(props: React.PropsWithChildren) {
  return (
    <Authenticator.Provider>
      <Header />
      <div className="container">{props.children}</div>
      <Footer />
    </Authenticator.Provider>
  );
}
