"use client";
import React, { useContext, useEffect } from "react";
import Resume from "./Resume";
import TempRegister from "./TempRegister";
import UsaJobs from "./UsaJobs";
import { AllyContext, AllyContextType } from "../../providers";
import { useSendJsonMessage } from "../../utils/api";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WEB_SOCKET_URL, TEST_WEB_SOCKET_URL } from "@/app/constants";
const socketUrl = TEST_WEB_SOCKET_URL;
export default function AllyContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    email,
    jobDescription,
    resume,
    name,
    step,
    url,
    setEmail,
    setJobDescription,
    setResume,
    setName,
    setStep,
    setUrl,
  } = useContext(AllyContext) as AllyContextType;

  const { readyState, sendJsonMessage, lastJsonMessage, lastMessage } =
    useWebSocket(socketUrl, { share: true });
  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  useEffect(() => {
    console.log("Connection Status: ", connectionStatus);
    if (
      readyState === ReadyState.OPEN &&
      email &&
      jobDescription &&
      resume &&
      name &&
      step
    ) {
      console.log("sending message");
      sendJsonMessage({ email, jobDescription, resume, name, step });
      console.log("last message received", lastMessage);
    }
  }, [readyState, email, jobDescription, resume, name, step]);

  switch (step) {
    case 0:
      return (
        <TempRegister
          email={email}
          name={name}
          setEmail={setEmail}
          setName={setName}
          setStep={setStep}
        />
      );
    case 1:
      return <Resume name={name} setResume={setResume} setStep={setStep} />;
    case 2:
      return (
        <UsaJobs
          email={email}
          jobDescription={jobDescription}
          name={name}
          resume={resume}
          step={step}
          url={url}
          setStep={setStep}
          setUrl={setUrl}
          setJobDescription={setJobDescription}
        />
      );
    default:
      return <div>Nothing for the group</div>;
  }
}
