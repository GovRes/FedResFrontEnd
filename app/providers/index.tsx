"use client";

import React, { createContext, useEffect, useState, ReactNode } from "react";
import { QualificationsType, TopicType } from "../utils/responseSchemas";
// import { job as jd } from "../testData/testCandidate1/jobDescription";
import { keywords as kw } from "../testData/testCandidate1/keywords";
import { resume as r } from "../testData/testCandidate1/resume";
import { topics as t } from "../testData/testCandidate1/topics";
export type StepType =
  | "temp_registration"
  | "resume"
  | "usa_jobs"
  | "wrong_met_to_unmet"
  | "wrong_unmet_to_met"
  | "edit_met_qualifications"
  | "make_changes_to_met_qualifications"
  | "qualifications_final_review"
  | "pause";

export interface AllyContextType {
  email?: string;
  job?: JobType;
  keywords?: string[];
  loading: boolean;
  loadingText: string;
  name?: string;
  qualifications?: QualificationsType;
  recommendation: string;
  reviewedMetQualifications: boolean;
  reviewedUnmetQualifications: boolean;
  resume?: string;
  resumes?: string[];
  step?: StepType;
  topics?: TopicType[];
  url?: string;
  setEmail: (step: string) => void;
  setJob: (job: JobType) => void;
  setKeywords: (keywords: string[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (loadingText: string) => void;
  setName: (name: string) => void;
  setQualifications: (qualifications: QualificationsType) => void;
  setRecommendation: (recommendation: string) => void;
  setReviewedMetQualifications: (reviewedMetQualifications: boolean) => void;
  setReviewedUnmetQualifications: (
    reviewedUnmetQualifications: boolean
  ) => void;
  setResume: (resume: string) => void;
  setResumes: (resumes: string[]) => void;
  setStep: (step: StepType) => void;
  setTopics: (topics: TopicType[]) => void;
  setUrl: (url: string) => void;
}

export interface JobType {
  title: string;
  department: string;
  evaluationCriteria: string;
  duties: string;
  agencyDescription: string;
}

export const AllyContext = createContext<AllyContextType | undefined>(
  undefined
);

export const AllyProvider = ({ children }: { children: ReactNode }) => {
  const test = false;
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<JobType>();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Talking to the AI");
  const [name, setName] = useState("");
  const [qualifications, setQualifications] = useState<QualificationsType>({
    metQualifications: [],
    unmetQualifications: [],
  });
  const [recommendation, setRecommendation] = useState("");
  const [resume, setResume] = useState("");
  const [resumes, setResumes] = useState<string[]>();
  const [reviewedMetQualifications, setReviewedMetQualifications] =
    useState(false);
  const [reviewedUnmetQualifications, setReviewedUnmetQualifications] =
    useState(false);
  const [step, setStep] = useState<StepType>("usa_jobs");
  const [topics, setTopics] = useState<TopicType[]>();
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (test) {
      // setJob(jd);
      setKeywords(kw);
      setResume(r);
      setReviewedMetQualifications(true);
      setReviewedUnmetQualifications(true);
      setTopics(t);
    }
  }, [test]);

  return (
    <AllyContext.Provider
      value={{
        email,
        job,
        keywords,
        loading,
        loadingText,
        name,
        qualifications,
        recommendation,
        reviewedMetQualifications,
        reviewedUnmetQualifications,
        resume,
        resumes,
        step,
        topics,
        url,
        setEmail,
        setKeywords,
        setJob,
        setLoading,
        setLoadingText,
        setName,
        setQualifications,
        setRecommendation,
        setReviewedMetQualifications,
        setReviewedUnmetQualifications,
        setResume,
        setResumes,
        setStep,
        setTopics,
        setUrl,
      }}
    >
      {children}
    </AllyContext.Provider>
  );
};
