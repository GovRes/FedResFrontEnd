"use client";

import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { JobType, StepsType } from "../../lib/utils/responseSchemas";
import { getApplicationWithJob } from "../../lib/crud/application";
import {
  completeSteps,
  applyStepDisablingLogic,
} from "../../lib/utils/stepUpdater";
import { navigateToNextIncompleteStep } from "../../lib/utils/nextStepNavigation";
import { useRouter } from "next/navigation";
import { getJobByApplicationId } from "../../lib/crud/job";

// Processing status interface
interface ProcessingStatus {
  pastJobsProcessed: boolean;
  volunteerProcessed: boolean;
}

// Combined interface for state + methods
interface ApplicationContextType {
  // State properties
  job: JobType | undefined;
  steps: StepsType[];
  applicationId: string;
  initialRedirectComplete: boolean;
  processingStatus: ProcessingStatus;
  resetApplication: () => void;
  setJob: (value: JobType) => void;
  setSteps: (value: StepsType[]) => void;
  setApplicationId: (value: string) => void;
  setInitialRedirectComplete: (value: boolean) => void;
  completeStep: (stepId: string, appId?: string) => Promise<void>;
  markProcessingComplete: (type: "pastJobs" | "volunteer") => void;
  isProcessingComplete: (type: "pastJobs" | "volunteer") => boolean;
}

// Default steps array
export const defaultSteps: StepsType[] = [
  {
    id: "usa-jobs",
    title: "USAJobs",
    description: "Select a federal job",
    completed: false,
    disabled: false,
    path: "/usa-jobs",
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
  const [applicationId, setApplicationIdState] = useState(initialAppId || "");
  const [initialRedirectComplete, setInitialRedirectComplete] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Processing status tracking
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    pastJobsProcessed: false,
    volunteerProcessed: false,
  });

  const router = useRouter();

  // Refs to prevent infinite loops
  const dataLoadedRef = useRef(false);
  const applicationLoadingRef = useRef(false);

  // Map to track processing status per application ID
  const processingMapRef = useRef<Map<string, ProcessingStatus>>(new Map());

  // Wrap setApplicationId in useCallback to prevent unnecessary re-renders
  const setApplicationId = useCallback((id: string) => {
    setApplicationIdState(id);
  }, []);

  // Function to mark processing as complete for a specific type
  const markProcessingComplete = useCallback(
    (type: "pastJobs" | "volunteer") => {
      if (!applicationId) return;

      // Update the current state
      setProcessingStatus((prev) => ({
        ...prev,
        [type === "pastJobs" ? "pastJobsProcessed" : "volunteerProcessed"]:
          true,
      }));

      // Update the persistent map
      const currentStatus = processingMapRef.current.get(applicationId) || {
        pastJobsProcessed: false,
        volunteerProcessed: false,
      };

      const updatedStatus = {
        ...currentStatus,
        [type === "pastJobs" ? "pastJobsProcessed" : "volunteerProcessed"]:
          true,
      };

      processingMapRef.current.set(applicationId, updatedStatus);

      // Store in sessionStorage for persistence
      if (typeof window !== "undefined") {
        const storageKey = `processing_${applicationId}`;
        sessionStorage.setItem(storageKey, JSON.stringify(updatedStatus));
      }
    },
    [applicationId]
  );

  // Function to check if processing is complete for a specific type
  const isProcessingComplete = useCallback(
    (type: "pastJobs" | "volunteer") => {
      if (!applicationId) return false;

      const status =
        processingMapRef.current.get(applicationId) || processingStatus;
      return type === "pastJobs"
        ? status.pastJobsProcessed
        : status.volunteerProcessed;
    },
    [applicationId, processingStatus]
  );

  // Wrap resetApplication in useCallback
  const resetApplication = useCallback(() => {
    setApplicationId("");
    setJob(undefined);
    setSteps(defaultSteps);
    setInitialRedirectComplete(false);
    setProcessingStatus({
      pastJobsProcessed: false,
      volunteerProcessed: false,
    });

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("applicationId");

      // Clean up processing status from sessionStorage for current application
      if (applicationId) {
        sessionStorage.removeItem(`processing_${applicationId}`);
      }

      // Optional: Clean up all processing entries (more thorough cleanup)
      // This removes processing status for all applications
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("processing_")) {
          sessionStorage.removeItem(key);
        }
      });
    }

    // Clear processing map
    processingMapRef.current.clear();
    dataLoadedRef.current = false;
    applicationLoadingRef.current = false;
  }, [setApplicationId, applicationId]);

  // Load processing status when applicationId changes
  useEffect(() => {
    if (!applicationId) {
      setProcessingStatus({
        pastJobsProcessed: false,
        volunteerProcessed: false,
      });
      return;
    }

    // Check if we have the status in our map first
    const mapStatus = processingMapRef.current.get(applicationId);
    if (mapStatus) {
      setProcessingStatus(mapStatus);
      return;
    }

    // Load from sessionStorage
    if (typeof window !== "undefined") {
      const storageKey = `processing_${applicationId}`;
      const storedStatus = sessionStorage.getItem(storageKey);

      if (storedStatus) {
        try {
          const parsedStatus = JSON.parse(storedStatus) as ProcessingStatus;
          setProcessingStatus(parsedStatus);
          processingMapRef.current.set(applicationId, parsedStatus);
        } catch (error) {
          console.error("Error parsing stored processing status:", error);
          // Reset to default if parsing fails
          const defaultStatus = {
            pastJobsProcessed: false,
            volunteerProcessed: false,
          };
          setProcessingStatus(defaultStatus);
          processingMapRef.current.set(applicationId, defaultStatus);
        }
      } else {
        // No stored status, use defaults
        const defaultStatus = {
          pastJobsProcessed: false,
          volunteerProcessed: false,
        };
        setProcessingStatus(defaultStatus);
        processingMapRef.current.set(applicationId, defaultStatus);
      }
    }
  }, [applicationId]);

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

  // Centralized method to complete steps - also wrapped in useCallback
  const completeStep = useCallback(
    async (stepId: string, appId?: string) => {
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
    },
    [applicationId, steps]
  );

  // Updated sessionStorage sync effect
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only update sessionStorage when applicationId changes, don't read from it here
    if (applicationId) {
      const storedAppId = sessionStorage.getItem("applicationId");
      if (storedAppId !== applicationId) {
        sessionStorage.setItem("applicationId", applicationId);

        // Dispatch custom event to notify other components
        const event = new CustomEvent("applicationIdChanged", {
          detail: { applicationId },
        });
        window.dispatchEvent(event);
      }
      // Reset data loaded flag when applicationId changes
      dataLoadedRef.current = false;
    } else {
      // Clear sessionStorage when applicationId is empty
      sessionStorage.removeItem("applicationId");
    }
  }, [applicationId]);

  // Simplified storage sync effect for reset events only
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Handle custom events for application reset only
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.type === "reset") {
        resetApplication();
      }
    };

    // Add event listeners for changes
    window.addEventListener(STORAGE_EVENT_KEY, handleCustomEvent);

    return () => {
      window.removeEventListener(STORAGE_EVENT_KEY, handleCustomEvent);
    };
  }, [resetApplication]); // Include resetApplication in dependencies since it's now memoized

  useEffect(() => {
    if (!applicationId) return;

    // Prevent multiple concurrent loads
    if (applicationLoadingRef.current) return;
    applicationLoadingRef.current = true;

    async function loadJobData() {
      try {
        const { data } = await getJobByApplicationId(applicationId);
        if (data) {
          // Only update if the job actually changed
          setJob((prevJob) => {
            if (!prevJob || prevJob.id !== data.id) {
              return data;
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
  }, [applicationId, resetApplication]); // Include resetApplication dependency

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
        const { data: applicationRes } = await getApplicationWithJob({
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
              console.log("Navigating to next step");
              navigateToNextIncompleteStep({
                applicationId,
                completeStep,
                currentStepId: "usa-jobs",
                router,
                steps,
              });
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
    resetApplication,
    completeStep,
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
  }, [applicationId, setApplicationId]); // Include setApplicationId in dependencies

  const value = useMemo(
    () => ({
      applicationId,
      job,
      steps: stepsWithDisabling, // Use memoized steps with disabling logic applied
      processingStatus,
      resetApplication,
      setApplicationId,
      setJob,
      setSteps,
      initialRedirectComplete,
      setInitialRedirectComplete,
      completeStep,
      markProcessingComplete,
      isProcessingComplete,
    }),
    [
      applicationId,
      job,
      stepsWithDisabling,
      processingStatus,
      resetApplication,
      setApplicationId,
      initialRedirectComplete,
      completeStep,
      markProcessingComplete,
      isProcessingComplete,
    ]
  );

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
