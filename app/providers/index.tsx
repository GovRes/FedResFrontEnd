"use client";

import React, {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useRef,
} from "react";
import {
  QualificationsType,
  SpecializedExperienceType,
  TopicType,
} from "../utils/responseSchemas";
// import { job as jd } from "../testData/testCandidate1/jobDescription";
import { keywords as kw } from "../testData/testCandidate1/keywords";
import { resume as r } from "../testData/testCandidate1/resume";
import { topics as t } from "../testData/testCandidate1/topics";
export type StepType =
  | "temp_registration"
  | "resume"
  | "usa_jobs"
  | "specialized_experience"
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
  loading: React.RefObject<boolean>;
  loadingText: React.RefObject<string>;
  name?: string;
  qualifications?: QualificationsType;
  recommendation: string;
  reviewedMetQualifications: boolean;
  reviewedUnmetQualifications: boolean;
  resume?: string;
  resumes?: string[];
  specializedExperiences?: SpecializedExperienceType[];
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
  setSpecializedExperiences: (
    specializedExperiences: SpecializedExperienceType[]
  ) => void;
  setStep: (step: StepType) => void;
  setTopics: (topics: TopicType[]) => void;
  setUrl: (url: string) => void;
}

export interface JobType {
  agencyDescription: string;
  department: string;
  duties: string;
  evaluationCriteria: string;
  qualificationsSummary: string;
  requiredDocuments: string;
  title: string;
}
export const AllyContext = createContext<AllyContextType | undefined>(
  undefined
);

export const AllyProvider = ({ children }: { children: ReactNode }) => {
  const test = false;
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<JobType>();
  const [keywords, setKeywords] = useState<string[]>([]);
  // Use refs for loading state
  const loading = useRef(false);
  const loadingText = useRef("Talking to the Zoltar machine");

  const setLoading = (value: boolean) => {
    loading.current = value;
  };

  const setLoadingText = (text: string) => {
    loadingText.current = text;
  };
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
  const [specializedExperiences, setSpecializedExperiences] = useState<
    SpecializedExperienceType[]
  >([]);
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
  const contextValue = useMemo(
    () => ({
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
      specializedExperiences,
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
      setSpecializedExperiences,
      setStep,
      setTopics,
      setUrl,
    }),
    [
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
      specializedExperiences,
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
      setSpecializedExperiences,
      setStep,
      setTopics,
      setUrl,
    ]
  );
  return (
    <AllyContext.Provider value={contextValue}>{children}</AllyContext.Provider>
  );
};
