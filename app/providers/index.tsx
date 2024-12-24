"use client";

import React, { createContext, useState, ReactNode } from "react";
import { QualificationsType } from "../utils/responseSchemas";
export type StepType =  "temp_registration" | "resume" | "usa_jobs" | "career_coach" | "pause"
export interface AllyContextType {
  email?: string;
  jobDescription?: string;
  keywords?: string[];
  loading: boolean;
  name?: string;
  qualifications?: QualificationsType;
  recommendation: string;
  resume?: string;
  step?: StepType;
  url?: string;
  setEmail: (step: string) => void;
  setJobDescription: (jobDescription: string) => void;
  setKeywords: (keywords: string[]) => void;
  setLoading: (loading: boolean) => void;
  setName: (name: string) => void;
  setQualifications: (qualifications: QualificationsType) => void;
  setRecommendation: (recommendation: string) => void;
  setResume: (resume: string) => void;
  setStep: (step: StepType) => void;
  setUrl: (url: string) => void;
}

export const AllyContext = createContext<AllyContextType | undefined>(
  undefined
);

export const AllyProvider = ({ children }: { children: ReactNode }) => {
  const [email, setEmail] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [qualifications, setQualifications] = useState<QualificationsType>({metQualifications: [], unmetQualifications: []});
  const [recommendation, setRecommendation] = useState("");
  const [resume, setResume] = useState("");
  const [step, setStep] = useState<StepType>("resume");
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);

  return (
    <AllyContext.Provider
      value={{
        email,
        jobDescription,
        keywords,
        loading,
        name,
        qualifications,
        recommendation,
        resume,
        step,
        url,
        setEmail,
        setKeywords,
        setJobDescription,
        setLoading,
        setName,
        setQualifications,
        setRecommendation,
        setResume,
        setStep,
        setUrl,
      }}
    >
      {children}
    </AllyContext.Provider>
  );
};
