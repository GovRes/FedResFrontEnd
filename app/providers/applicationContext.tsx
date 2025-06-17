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
interface ApplicationContextType {
  // State properties
  job: JobType | undefined;
  steps: StepsType[];
  applicationId: string;
  initialRedirectComplete: boolean;
  resetApplication: () => void;
  setJob: (value: JobType) => void;
  setSteps: (value: StepsType[]) => void;
  setApplicationId: (value: string) => void;
  setInitialRedirectComplete: (value: boolean) => void;
}

// Default steps array
export const defaultSteps: StepsType[] = [
  {
    id: "usa-jobs",
    title: "USAJobs",
    description: "Select a federal job",
    completed: false,
    path: "/job-search",
  },
  {
    id: "specialized-experience",
    title: "Specialized Experience",
    description: "Add specialized experience",
    completed: false,
    path: "/specialized-experience",
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
    path: "/past-jobs",
  },
  {
    id: "awards",
    title: "Awards",
    description: "Add and edit awards",
    completed: false,
    path: "/awards",
  },
  {
    id: "education",
    title: "Education",
    description: "Add and edit educational experiences",
    completed: false,
    path: "/education",
  },
  {
    id: "volunteer-experiences",
    title: "Volunteer Experience",
    description: "Add and edit volunteer experiences",
    completed: false,
    path: "/volunteer-experiences",
  },
  {
    id: "past-job-details",
    title: "Past Job Details",
    description: "Write a description of past jobs",
    completed: false,
    path: "/past-job-details",
  },
  {
    id: "volunteer-details",
    title: "Volunteer Details",
    description: "Write a description of volunteer experiences",
    completed: false,
    path: "/volunteer-details",
  },
  {
    id: "specialized-experience-details",
    title: "Specialized Experience",
    description: "get details on specialized experience",
    completed: false,
    path: "/specialized-experience-details",
  },
  {
    id: "return-resume",
    title: "Final Resume",
    description: "A resume you can use in your job application",
    completed: false,
    path: "/return-resume",
  },
];

const ApplicationContext = createContext<ApplicationContextType | undefined>(
  undefined
);

interface ApplicationProviderProps {
  children: ReactNode;
  initialSteps?: StepsType[];
  initialAppId?: string;
  initialJob?: JobType;
}

// Custom event to handle storage changes
const STORAGE_EVENT_KEY = "applicationStorage";

// Function to broadcast storage changes
export const broadcastApplicationReset = () => {
  if (typeof window !== "undefined") {
    // Create and dispatch a custom event
    const event = new CustomEvent(STORAGE_EVENT_KEY, {
      detail: { type: "reset" },
    });
    window.dispatchEvent(event);
  }
};

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
  const [initialRedirectComplete, setInitialRedirectComplete] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();

  // Refs to prevent infinite loops
  const dataLoadedRef = useRef(false);
  const applicationLoadingRef = useRef(false);

  function resetApplication() {
    setApplicationId("");
    setJob(undefined);
    setSteps(defaultSteps);
    setInitialRedirectComplete(false);

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("applicationId");
    }

    dataLoadedRef.current = false;
    applicationLoadingRef.current = false;
  }

  // Listen for storage changes from other components
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check sessionStorage on mount and syncs with state
    const syncWithSessionStorage = () => {
      const storedAppId = sessionStorage.getItem("applicationId");

      // If applicationId exists in state but not in storage, reset the application
      if (applicationId && !storedAppId) {
        resetApplication();
        return;
      }

      // If there's a different applicationId in storage than in state, update state
      if (storedAppId && storedAppId !== applicationId) {
        setApplicationId(storedAppId);
      }
    };

    // Handle custom events for application reset
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === "reset") {
        resetApplication();
      }
    };

    // Initial sync
    syncWithSessionStorage();

    // Add event listeners for changes
    window.addEventListener(STORAGE_EVENT_KEY, handleCustomEvent);
    window.addEventListener("storage", syncWithSessionStorage);

    // Polling mechanism to check storage periodically (as a backup)
    const intervalId = setInterval(syncWithSessionStorage, 1000);

    return () => {
      window.removeEventListener(STORAGE_EVENT_KEY, handleCustomEvent);
      window.removeEventListener("storage", syncWithSessionStorage);
      clearInterval(intervalId);
    };
  }, [applicationId]);

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
        // If there's an error loading job data, it could be because the application was deleted
        // Check if applicationId is still valid in sessionStorage
        if (typeof window !== "undefined") {
          const storedAppId = sessionStorage.getItem("applicationId");
          if (!storedAppId || storedAppId !== applicationId) {
            resetApplication();
          }
        }
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
          // Application not found - it might have been deleted
          resetApplication();
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
        // If there's an error loading application data, check if it was deleted
        if (typeof window !== "undefined") {
          const storedAppId = sessionStorage.getItem("applicationId");
          if (!storedAppId || storedAppId !== applicationId) {
            resetApplication();
          }
        }
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
    resetApplication,
    setApplicationId,
    setJob,
    setSteps,
    initialRedirectComplete,
    setInitialRedirectComplete,
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
