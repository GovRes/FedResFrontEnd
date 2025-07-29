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
import { JobType, StepsType } from "../utils/responseSchemas";
import { getApplicationWithJob } from "../crud/application";
import { completeSteps, applyStepDisablingLogic } from "../utils/stepUpdater";
import { navigateToNextIncompleteStep } from "../utils/nextStepNavigation";

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

    disabled: false,
    path: "/usa-jobs",

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
  const [applicationId, setApplicationIdState] = useState(initialAppId || "");
  const [initialRedirectComplete, setInitialRedirectComplete] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const router = useRouter();

  // Refs to prevent infinite loops
  const dataLoadedRef = useRef(false);
  const applicationLoadingRef = useRef(false);

  // Wrap setApplicationId in useCallback to prevent unnecessary re-renders
  const setApplicationId = useCallback((id: string) => {
    setApplicationIdState(id);
  }, []);

  // Wrap resetApplication in useCallback
  const resetApplication = useCallback(() => {

    setApplicationId("");
    setJob(undefined);
    setSteps(defaultSteps);
    setInitialRedirectComplete(false);


    if (typeof window !== "undefined") {
      sessionStorage.removeItem("applicationId");
    }

    dataLoadedRef.current = false;
    applicationLoadingRef.current = false;
  }, [setApplicationId]);

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

    resetApplication,
    completeStep,

  ]);

  // Effect to load application ID from sessionStorage on initial mount
  useEffect(() => {
    if (applicationId || typeof window === "undefined") return;

    const storedAppId = sessionStorage.getItem("applicationId");
    if (storedAppId) {
      setApplicationId(storedAppId);
    } else {
    }

  }, [applicationId, setApplicationId]); // Include setApplicationId in dependencies

  const value = useMemo(
    () => ({
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
    }),
    [
      applicationId,
      job,
      stepsWithDisabling,
      resetApplication,
      setApplicationId,
      initialRedirectComplete,
      completeStep,
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
