"use client";
import React, { useContext } from "react";
import Resume from "./Resume";
import TempRegister from "./TempRegister";
import UsaJobs from "./UsaJobs";
import { AllyContext, AllyContextType } from "../../providers";
export default function AllyContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    email,
    jobDescription,
    name,
    step,
    url,
    setEmail,
    setJobDescription,
    setName,
    setStep,
    setUrl,
  } = useContext(AllyContext) as AllyContextType;
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
      return <Resume name={name} setName={setName} setStep={setStep} />;
    case 2:
      return (
        <UsaJobs
          jobDescription={jobDescription}
          name={name}
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
