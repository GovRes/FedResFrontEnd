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
  const router = useRouter();

  // Effect to save applicationId to sessionStorage when it changes
  useEffect(() => {
    // Only save if we have a value and we're in browser environment
    async function getJob() {
      if (applicationId) {
        const jobRes = await getJobByApplicationId(applicationId);
        console.log("Provider: Job loaded:", jobRes);
        setJob(jobRes);
      }
    }
    if (applicationId && typeof window !== "undefined") {
      console.log(
        "Provider: Saving applicationId to sessionStorage:",
        applicationId
      );
      sessionStorage.setItem("applicationId", applicationId);
    }
    getJob();
  }, [applicationId]); // Run whenever applicationId changes

  // Effect to update steps when applicationId changes (but not on initial load)
  useEffect(() => {
    // Skip this effect if we already have initialSteps and this is the initial applicationId
    if (initialJob && initialSteps && applicationId === initialAppId) {
      console.log("Provider: Using initial job and steps from props");
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
          console.log(153, applicationRes);

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
              console.log(steps);
            }

            // Mark as ready if we have a job (either existing or new)
            if (job || applicationRes.job) {
              const updatedSteps = await completeSteps({
                steps,
                stepId: "usa-jobs",
                applicationId: applicationRes.id,
              });
              setSteps(updatedSteps);
              const next = findNextIncompleteStep(steps, "usa-jobs");
              if (next) {
                router.push(`/ally${next.path}`);
              }
              console.log("Provider: Application is ready");
            }
          }
        } catch (error) {
          console.error("Provider: Error updating job and steps:", error);
        }
      }

      updateJobAndSteps();
    }
  }, [applicationId, initialAppId, initialSteps, initialJob, job]);

  // effect to load application ID from sessionStorage if not set
  useEffect(() => {
    async function fetchApplication(storedAppId: string) {
      let application = await getApplicationWithJob({ id: storedAppId });
      console.log(application);
    }
    if (!applicationId) {
      const storedAppId = sessionStorage.getItem("applicationId");
      if (storedAppId) {
        fetchApplication(storedAppId);
        setApplicationId(storedAppId);
      } else {
        console.log("Provider: No applicationId found in sessionStorage");
      }
    }
  }, []);

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
