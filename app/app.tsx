"use client";
import "./ConfigureAmplify";
import "@aws-amplify/ui-react/styles.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Authenticator } from "@aws-amplify/ui-react";
import NextTopLoader from "nextjs-toploader";

export default function App(props: React.PropsWithChildren) {
  return (
    <Authenticator.Provider>
      <NextTopLoader
        color="#2299DD"
        initialPosition={0.08}
        crawlSpeed={200}
        height={8}
        crawl={true}
        showSpinner={true}
        easing="ease"
        speed={200}
        shadow="0 0 10px #2299DD,0 0 5px #2299DD"
      />
      <Header />
      <div className="container">{props.children}</div>
      <Footer />
    </Authenticator.Provider>
  );
}
