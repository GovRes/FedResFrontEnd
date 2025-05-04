"use client";

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { JobType, StepsType } from "../utils/responseSchemas";
import { getApplicationWithJob } from "../crud/application";

// Combined interface for state + methods
export interface ApplicationContextType {
  // State properties
  job: JobType | undefined;
  steps: StepsType[];
  applicationId: string;
  isReady: boolean; // Added isReady property
  setJob: (value: JobType) => void;
  setSteps: (value: StepsType[]) => void;
  setApplicationId: (value: string) => void;
}

// Default steps array
export const defaultSteps: StepsType[] = [
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
    id: "past-jobs",
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
];

export const ApplicationContext = createContext<
  ApplicationContextType | undefined
>(undefined);

interface ApplicationProviderProps {
  children: ReactNode;
  initialSteps?: StepsType[];
  initialAppId?: string;
  initialJob?: JobType;
}

export const ApplicationProvider = ({
  children,
  initialSteps,
  initialAppId,
  initialJob,
}: ApplicationProviderProps) => {
  // State declarations with initial values if provided
  const [job, setJob] = useState<JobType | undefined>(initialJob);
  const [steps, setSteps] = useState<StepsType[]>(initialSteps || defaultSteps);
  const [applicationId, setApplicationId] = useState(initialAppId || "");
  const [isReady, setIsReady] = useState(!!initialJob); // isReady is true if initialJob exists

  // Effect to save applicationId to sessionStorage when it changes
  useEffect(() => {
    // Only save if we have a value and we're in browser environment
    if (applicationId && typeof window !== "undefined") {
      console.log(
        "Provider: Saving applicationId to sessionStorage:",
        applicationId
      );
      sessionStorage.setItem("applicationId", applicationId);
    }
  }, [applicationId]); // Run whenever applicationId changes

  // Effect to update steps when applicationId changes (but not on initial load)
  useEffect(() => {
    // Reset isReady when applicationId changes
    if (!job) {
      setIsReady(false);
    }

    // Skip this effect if we already have initialSteps and this is the initial applicationId
    if (initialJob && initialSteps && applicationId === initialAppId) {
      console.log("Provider: Using initial job and steps from props");
      setIsReady(true);
      return;
    }

    // Only run if applicationId is set
    if (applicationId && typeof window !== "undefined") {
      console.log("Provider: Application ID changed, updating job and steps");

      async function updateJobAndSteps() {
        try {
          const applicationRes = await getApplicationWithJob({
            id: applicationId,
          });

          if (applicationRes) {
            console.log("Provider: Application data loaded:", applicationRes);

            // Update job if it doesn't exist or if it's changed
            if (
              (!job || job.id !== applicationRes.job?.id) &&
              applicationRes.job
            ) {
              console.log("Provider: Setting job from application response");
              setJob(applicationRes.job);
            }

            // Update steps based on the application response
            if (applicationRes.completedSteps) {
              console.log(
                "Provider: Loading completed steps:",
                applicationRes.completedSteps
              );

              const updatedSteps = steps.map((step: StepsType) => ({
                ...step,
                completed: applicationRes.completedSteps.includes(step.id),
              }));

              setSteps(updatedSteps);
            }

            // Mark as ready if we have a job (either existing or new)
            if (job || applicationRes.job) {
              console.log("Provider: Application is ready");
              setIsReady(true);
            }
          }
        } catch (error) {
          console.error("Provider: Error updating job and steps:", error);
        }
      }

      updateJobAndSteps();
    }
  }, [applicationId, initialAppId, initialSteps, initialJob, job]);

  // Effect to update isReady when job changes
  useEffect(() => {
    setIsReady(!!job);
  }, [job]);

  const value = {
    applicationId,
    job,
    steps,
    isReady,
    setApplicationId,
    setJob,
    setSteps,
  };

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  );
};

export function useApplication() {
  const context = useContext(ApplicationContext);
  if (context === undefined) {
    throw new Error("useApplication must be used within a ApplicationProvider");
  }
  return context;
}
