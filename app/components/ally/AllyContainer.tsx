"use client";
import React, { useContext, useEffect } from "react";
import CareerCoach from "./CareerCoach";
import Resume from "./Resume";
import TempRegister from "./TempRegister";
import UsaJobs from "./UsaJobs";
import { AllyContext, AllyContextType } from "../../providers";
import { useSendJsonMessage } from "../../utils/api";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { WEB_SOCKET_URL, TEST_WEB_SOCKET_URL } from "@/app/constants";
const socketUrl = TEST_WEB_SOCKET_URL;
export interface Qualification {
  id: number;
  name: string;
  description: string;
}
export default function AllyContainer() {
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

  const tempQualifications = {
    unmetQualifications: [
      { id: 1, name: "Python", description: "" },
      { id: 2, name: "Java", description: "" },
      { id: 3, name: "C++", description: "" },
    ],
    metQualifications: [
      { id: 4, name: "JavaScript", description: "was once a barista" },
      {
        id: 5,
        name: "React",
        description: "Wrote a complex front-end web application",
      },
      { id: 6, name: "Node.js", description: "Built a server" },
    ],
  };

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
    case 3:
      // actually, qualifications will be lastJsonMessage probably but I'm making a temp object here.
      return (
        <CareerCoach
          email={email}
          qualifications={tempQualifications}
          setStep={setStep}
          step={step}
        />
      );
    default:
      return <div>Nothing for the group</div>;
  }
}
