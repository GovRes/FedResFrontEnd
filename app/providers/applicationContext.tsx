"use client";

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { JobType, StepsType } from "../utils/responseSchemas";
import { getApplicationWithJob } from "../crud/application";
import { completeSteps, applyStepDisablingLogic } from "../utils/stepUpdater";
import { findNextIncompleteStep } from "../utils/nextStepNavigation";
import { useRouter } from "next/navigation";
import { getJobByApplicationId } from "../crud/job";
import { useLoading } from "./loadingContext";

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
  completeStep: (stepId: string, appId?: string) => Promise<void>;
}

// Default steps array
export const defaultSteps: StepsType[] = [
  {
    id: "usa-jobs",
    title: "USAJobs",
    description: "Select a federal job",
    completed: false,
    disabled: false,
    path: "/job-search",
  },
  {
    id: "extract-keywords",
    title: "Extract Keywords",
    description: "Extract keywords from the job description",
    completed: false,
    disabled: true,
    path: "/extract-keywords",
  },
  {
    id: "past-jobs",
    title: "Past Jobs",
    description: "Add and edit past jobs",
    completed: false,
    disabled: true,
    path: "/past-jobs",
  },
  {
    id: "awards",
    title: "Awards",
    description: "Add and edit awards",
    completed: false,
    disabled: true,
    path: "/awards",
  },
  {
    id: "education",
    title: "Education",
    description: "Add and edit educational experiences",
    completed: false,
    disabled: true,
    path: "/education",
  },
  {
    id: "volunteer-experiences",
    title: "Volunteer Experience",
    description: "Add and edit volunteer experiences",
    completed: false,
    disabled: true,
    path: "/volunteer-experiences",
  },
  {
    id: "past-job-details",
    title: "Past Job Details",
    description: "Write a description of past jobs",
    completed: false,
    disabled: true,
    path: "/past-job-details",
  },
  {
    id: "volunteer-details",
    title: "Volunteer Details",
    description: "Write a description of volunteer experiences",
    completed: false,
    disabled: true,
    path: "/volunteer-details",
  },
  {
    id: "return-resume",
    title: "Final Resume",
    description: "A resume you can use in your job application",
    completed: false,
    disabled: false,
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
  const { setIsLoading } = useLoading();

  // Refs to prevent infinite loops
  const dataLoadedRef = useRef(false);
  const applicationLoadingRef = useRef(false);

  // Get current step synchronously from URL
  const getCurrentStepId = () => {
    if (typeof window === "undefined") return undefined;
    const currentPath = window.location.pathname;
    const currentStep = defaultSteps.find((step) => {
      const stepPath = step.path.startsWith("/")
        ? step.path.slice(1)
        : step.path;
      return (
        currentPath.includes(`/ally/${stepPath}`) ||
        currentPath.endsWith(`/${stepPath}`)
      );
    });
    return currentStep?.id;
  };

  // State to track URL changes and force re-computation of step disabling
  const [urlChangeCounter, setUrlChangeCounter] = useState(0);

  // Apply disabling logic to steps at render time with memoization
  const stepsWithDisabling = useMemo(() => {
    const currentStepId = getCurrentStepId();
    return applyStepDisablingLogic(steps, currentStepId);
  }, [steps, urlChangeCounter]); // Re-compute when steps or URL changes

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

  // Centralized method to complete steps
  const completeStep = async (stepId: string, appId?: string) => {
    const activeApplicationId = appId || applicationId;

    if (!activeApplicationId) {
      console.error("Cannot complete step: no applicationId provided");
      return;
    }

    try {
      const updatedSteps = await completeSteps({
        steps,
        stepId,
        applicationId: activeApplicationId,
      });

      setSteps(updatedSteps);
    } catch (error) {
      console.error("Error completing step:", error);
      throw error; // Re-throw so components can handle it
    }
  };

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

    const storedAppId = sessionStorage.getItem("applicationId");

    // Don't overwrite existing applicationId with null
    if (storedAppId && !applicationId) {
      setApplicationId(storedAppId);
    } else if (applicationId && applicationId !== storedAppId) {
      sessionStorage.setItem("applicationId", applicationId);
      // Reset data loaded flag when applicationId changes
      dataLoadedRef.current = false;
    }
  }, [applicationId]);

  useEffect(() => {
    if (!applicationId) return;

    // Prevent multiple concurrent loads
    if (applicationLoadingRef.current) return;
    applicationLoadingRef.current = true;

    async function loadJobData() {
      try {
        const jobRes = await getJobByApplicationId(applicationId);
        if (jobRes) {
          // Only update if the job actually changed
          setJob((prevJob) => {
            if (!prevJob || prevJob.id !== jobRes.id) {
              return jobRes;
            }
            return prevJob;
          });
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
      } finally {
        applicationLoadingRef.current = false;
      }
    }

    loadJobData();
  }, [applicationId]); // Only depend on applicationId

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
          // Application not found - it might have been deleted
          resetApplication();
          return;
        }

        // Update job if needed (only if different)
        if (applicationRes.job) {
          setJob((prevJob) => {
            if (!prevJob || prevJob.id !== applicationRes.job.id) {
              return applicationRes.job;
            }
            return prevJob;
          });
        }

        // Update steps based on the application response
        if (
          applicationRes.completedSteps &&
          applicationRes.completedSteps.length > 0
        ) {
          // Create new steps array with completion status using defaultSteps as base
          const stepsWithCompletion = defaultSteps.map((step) => ({
            ...step,
            completed: applicationRes.completedSteps.includes(step.id),
          }));

          // Set the raw steps - disabling logic will be applied at render time
          setSteps(stepsWithCompletion);

          // Only navigate to next step if this is the initial load
          if (isInitialLoad) {
            setIsInitialLoad(false);

            // Ensure usa-jobs step is marked complete
            try {
              const stepsAfterComplete = await completeSteps({
                steps: stepsWithCompletion,
                stepId: "usa-jobs",
                applicationId: applicationRes.id,
              });

              // Set the raw steps - disabling logic will be applied at render time
              setSteps(stepsAfterComplete);

              // Find next incomplete step
              const next = findNextIncompleteStep(
                stepsAfterComplete,
                "usa-jobs"
              );
              if (next) {
                setIsLoading(true);
                router.push(`/ally${next.path}`);
              }
            } catch (error) {
              console.error("Provider: Error completing steps:", error);
            }
          }
        } else {
          setSteps(defaultSteps);
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
    initialJob?.id, // Only depend on job ID, not the entire object
    initialSteps?.length, // Only depend on the length, not the entire array
    initialAppId,
    isInitialLoad,
    router,
  ]);

  // Effect to detect URL changes and trigger re-computation of step disabling
  useEffect(() => {
    const handleRouteChange = () => {
      // Instead of updating steps directly, update a counter to trigger re-computation
      setUrlChangeCounter((prev) => prev + 1);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      // Use setTimeout to avoid calling setState during render
      setTimeout(handleRouteChange, 0);
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(window.history, args);
      // Use setTimeout to avoid calling setState during render
      setTimeout(handleRouteChange, 0);
    };

    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  // Effect to load application ID from sessionStorage on initial mount
  useEffect(() => {
    if (applicationId || typeof window === "undefined") return;

    const storedAppId = sessionStorage.getItem("applicationId");
    if (storedAppId) {
      setApplicationId(storedAppId);
    }
  }, []); // Empty dependency array - only run once on mount

  const value = {
    applicationId,
    job,
    steps: stepsWithDisabling, // Use memoized steps with disabling logic applied
    resetApplication,
    setApplicationId,
    setJob,
    setSteps,
    initialRedirectComplete,
    setInitialRedirectComplete,
    completeStep,
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
