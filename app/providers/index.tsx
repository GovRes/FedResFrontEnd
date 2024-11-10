"use client";

import React, { createContext, useState, ReactNode } from "react";

export interface AllyContextType {
  email?: string;
  jobDescription?: string;
  name?: string;
  resume?: string;
  step?: number;
  url?: string;
  setEmail: (step: string) => void;
  setJobDescription: (jobDescription: string) => void;
  setName: (name: string) => void;
  setResume: (resume: string) => void;
  setStep: (step: number) => void;
  setUrl: (url: string) => void;
}

export const AllyContext = createContext<AllyContextType | undefined>(
  undefined
);

export const AllyProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [name, setName] = useState("");
  const [resume, setResume] = useState("");
  const [step, setStep] = useState(3);
  const [url, setUrl] = useState("");

  return (
    <AllyContext.Provider
      value={{
        email,
        jobDescription,
        name,
        resume,
        step,
        url,
        setEmail,
        setJobDescription,
        setName,
        setResume,
        setStep,
        setUrl,
      }}
    >
      {children}
    </AllyContext.Provider>
  );
};
