"use client";

import React, { createContext, useState, ReactNode, useContext } from "react";
import { StepsType } from "../utils/responseSchemas";

// Combined interface for state + methods
export interface UserResumeContextType {
  // State properties
  steps: StepsType[];
  userResumeId: string;
  setSteps: (value: StepsType[]) => void;
  setUserResumeId: (value: string) => void;
}

export const UserResumeContext = createContext<
  UserResumeContextType | undefined
>(undefined);

export const UserResumeProvider = ({ children }: { children: ReactNode }) => {
  // State declarations
  const [steps, setSteps] = useState<StepsType[]>([
    {
      id: "usa-jobs",
      title: "USA Jobs",
      description: "Select a federal job",
      completed: false,
      path: "/job-search",
    },

    {
      id: "extract-keywords",
      title: "Extract Keywords",
      description: "Extract keywords from the job description",
      completed: false,
      path: "/extract-keywords",
    },

    {
      id: "past-experience",
      title: "Past Experience",
      description: "Select past job experiences",
      completed: false,
      path: "/past-experience",
    },
    {
      id: "user_jobs",
      title: "Past Jobs",
      description: "Add and edit past jobs",
      completed: false,
      path: "/past-experience/past-jobs",
    },

    {
      id: "awards",
      title: "Awards",
      description: "Add and edit awards",
      completed: false,
      path: "/past-experience/awards",
    },
    {
      id: "education",
      title: "Education",
      description: "Add and edit educational experiences",
      completed: false,
      path: "/past-experience/education",
    },
    {
      id: "volunteer",
      title: "Volunteer Experience",
      description: "Add and edit volunteer experiences",
      completed: false,
      path: "/past-experience/volunteer",
    },
    {
      id: "user_job_details",
      title: "User Job Details",
      description: "Write a description of past jobs",
      completed: false,
      path: "/past-experience/past-job-details",
    },
    {
      id: "volunteer-details",
      title: "Volunteer Details",
      description: "Write a description of volunteer experiences",
      completed: false,
      path: "/past-experience/volunteer-details",
    },
    {
      id: "specialized-experience",
      title: "Specialized Experience",
      description: "Add specialized experience",
      completed: false,
      path: "/specialized-experience",
    },
    {
      id: "return_resume",
      title: "Final Resume",
      description: "A resume you can use in your job application",
      completed: false,
      path: "/return-resume",
    },
  ]);
  const [userResumeId, setUserResumeId] = useState("");
  const value = {
    steps,
    userResumeId,
    setSteps,
    setUserResumeId,
  };

  return (
    <UserResumeContext.Provider value={value}>
      {children}
    </UserResumeContext.Provider>
  );
};

export function useUserResume() {
  const context = useContext(UserResumeContext);
  if (context === undefined) {
    throw new Error("useUserResume must be used within a UserResumeProvider");
  }
  return context;
}
