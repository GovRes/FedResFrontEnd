"use client";
import "../lib/amplify-config";
import "@aws-amplify/ui-react/styles.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Authenticator } from "@aws-amplify/ui-react";
import { useState } from "react";

export default function App(props: React.PropsWithChildren) {
  const [pending, setPending] = useState(false);
  return (
    <Authenticator.Provider>
      <Header />
      {pending ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="container">{props.children}</div>
      )}
      <Footer />
    </Authenticator.Provider>
  );
}
