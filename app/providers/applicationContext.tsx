"use client";

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import { JobType, StepsType } from "../utils/responseSchemas";
import { getApplicationWithJob } from "../crud/application";
import { completeSteps } from "../utils/stepUpdater";
import { findNextIncompleteStep } from "../utils/nextStepNavigation";
import { useRouter } from "next/navigation";
import { getJobByApplicationId } from "../crud/job";

// Combined interface for state + methods
export interface ApplicationContextType {
  // State properties
  job: JobType | undefined;
  steps: StepsType[];
  applicationId: string;
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
    path: "/past-experience/volunteer-experience",
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();

  // Refs to prevent infinite loops
  const dataLoadedRef = useRef(false);
  const applicationLoadingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Don't overwrite existing applicationId with null
    const storedAppId = sessionStorage.getItem("applicationId");
    if (storedAppId && !applicationId) {
      setApplicationId(storedAppId);
    } else if (applicationId) {
      sessionStorage.setItem("applicationId", applicationId);
    }
  }, [applicationId]);

  useEffect(() => {
    if (!applicationId) return;

    async function loadJobData() {
      try {
        const jobRes = await getJobByApplicationId(applicationId);
        if (jobRes) {
          setJob(jobRes);
        }
      } catch (error) {
        console.error("Error loading job data:", error);
      }
    }

    loadJobData();
  }, [applicationId]);

  // Effect to load application data and update steps
  useEffect(() => {
    // Skip if no applicationId or if we're not in browser
    if (!applicationId || typeof window === "undefined") return;

    // Skip if already loaded data for this applicationId
    if (dataLoadedRef.current) {
      return;
    }

    // Skip if already loading
    if (applicationLoadingRef.current) {
      return;
    }

    // Skip this effect if we already have initialSteps and this is the initial applicationId
    if (
      initialJob &&
      initialSteps &&
      applicationId === initialAppId &&
      isInitialLoad
    ) {
      setIsInitialLoad(false);
      dataLoadedRef.current = true;
      return;
    }

    // Set loading flag
    applicationLoadingRef.current = true;

    async function loadApplicationData() {
      try {
        const applicationRes = await getApplicationWithJob({
          id: applicationId,
        });

        if (!applicationRes) {
          applicationLoadingRef.current = false;
          return;
        }

        // Update job if needed
        if ((!job || job.id !== applicationRes.job?.id) && applicationRes.job) {
          setJob(applicationRes.job);
        }

        // Update steps based on the application response
        if (
          applicationRes.completedSteps &&
          applicationRes.completedSteps.length > 0
        ) {
          // Use functional update that doesn't depend on current steps
          setSteps((currentSteps) => {
            const updatedSteps = currentSteps.map((step) => ({
              ...step,
              completed: applicationRes.completedSteps.includes(step.id),
            }));

            return updatedSteps;
          });

          // Only navigate to next step if this is the initial load
          if (isInitialLoad && (job || applicationRes.job)) {
            setIsInitialLoad(false);

            // Use a copy of steps to avoid dependency on steps state
            const currentSteps = [...steps];
            const stepsForComplete = currentSteps.map((step) => ({
              ...step,
              completed: applicationRes.completedSteps.includes(step.id),
            }));

            // Ensure usa-jobs step is marked complete
            try {
              const stepsAfterComplete = await completeSteps({
                steps: stepsForComplete,
                stepId: "usa-jobs",
                applicationId: applicationRes.id,
              });

              // Use functional update to set steps
              setSteps(() => stepsAfterComplete);

              // Find next incomplete step
              const next = findNextIncompleteStep(
                stepsAfterComplete,
                "usa-jobs"
              );
              if (next) {
                router.push(`/ally${next.path}`);
              }
            } catch (error) {
              console.error("Provider: Error completing steps:", error);
            }
          }
        } else {
          console.log("Provider: No completed steps found in application");
        }

        // Mark data as loaded
        dataLoadedRef.current = true;
      } catch (error) {
        console.error("Provider: Error loading application data:", error);
      } finally {
        // Clear loading flag
        applicationLoadingRef.current = false;
      }
    }

    loadApplicationData();
  }, [
    applicationId,
    initialJob,
    initialSteps,
    initialAppId,
    isInitialLoad,
    job,
    router,
    steps,
  ]);

  // Effect to load application ID from sessionStorage on initial mount
  useEffect(() => {
    if (applicationId || typeof window === "undefined") return;

    const storedAppId = sessionStorage.getItem("applicationId");
    if (storedAppId) {
      setApplicationId(storedAppId);
    } else {
      console.log("Provider: No applicationId found in sessionStorage");
    }
  }, []); // Empty dependency array - only run once on mount

  const value = {
    applicationId,
    job,
    steps,
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
