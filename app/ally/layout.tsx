"use client";

import { ReactNode, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import AllyContainer from "./components/AllyContainer";
import styles from "./ally.module.css";
import {
  ApplicationProvider,
  useApplication,
} from "@/app/providers/applicationContext";
import { getApplicationWithJob } from "@/app/crud/application";
import { StepsType } from "@/app/utils/responseSchemas";
import { defaultSteps } from "@/app/providers/applicationContext";
import { Loader } from "../components/loader/Loader";
import { useLoading } from "../providers/loadingContext";

// This component will be inside the ApplicationProvider
function ApplicationLoader({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { setIsLoading } = useLoading();
  const {
    applicationId,
    setApplicationId,
    setInitialRedirectComplete,
    setSteps,
  } = useApplication();

  // Memoize the sessionStorage check function to prevent recreation
  const checkSessionStorage = useCallback(() => {
    const storedApplicationId = sessionStorage.getItem("applicationId");
    // Only update if different from current applicationId
    if (storedApplicationId && storedApplicationId !== applicationId) {
      setApplicationId(storedApplicationId);
    }
  }, [applicationId, setApplicationId]);

  // Effect to check for sessionStorage changes - removed applicationId from deps
  useEffect(() => {
    // Check immediately
    checkSessionStorage();

    // Create a storage event listener to detect changes
    const handleStorageChange = () => {
      checkSessionStorage();
    };

    // Custom event for direct communication
    const handleCustomEvent = (e: CustomEvent) => {
      checkSessionStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "applicationIdChanged",
      handleCustomEvent as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "applicationIdChanged",
        handleCustomEvent as EventListener
      );
    };
  }, [checkSessionStorage]); // Only depend on the memoized function

  useEffect(() => {
    async function loadApplicationData() {
      setLoading(true);

      if (applicationId) {
        try {
          const applicationRes = await getApplicationWithJob({
            id: applicationId,
          });

          if (applicationRes && applicationRes.completedSteps) {
            // Update steps based on the application response
            const updatedSteps = defaultSteps.map((step: StepsType) => ({
              ...step,
              completed: applicationRes.completedSteps.includes(step.id),
            }));

            // Update the steps in context
            setSteps(updatedSteps);

            // Handle redirection logic
            if (pathname === "/ally" || !pathname.includes("/ally/")) {
              const nextIncompleteStep = updatedSteps.find(
                (step) => !step.completed
              );
              if (nextIncompleteStep) {
                setInitialRedirectComplete(true);
                setIsLoading(true);
                router.push(`/ally${nextIncompleteStep.path}`);
                return; // Keep loading until redirect
              }
            }
          }
        } catch (error) {
          console.error(
            "ApplicationLoader: Error loading application data:",
            error
          );
        }
      } else if (pathname === "/ally") {
        // No application ID but on root path, redirect to first step
        setInitialRedirectComplete(true);
        setIsLoading(true);
        router.push("/ally/job-search");
        return; // Keep loading until redirect
      }

      // Finished loading
      setLoading(false);
    }

    loadApplicationData();
    // Removed setSteps and setInitialRedirectComplete from dependencies
    // as they are stable functions from context and don't need to trigger re-runs
  }, [applicationId, pathname, router, setIsLoading]);

  // Loading state UI
  if (loading && pathname === "/ally") {
    return <Loader text="Loading your application progress..." />;
  }

  // Normal content once loaded or if not on root path
  return <>{children}</>;
}

export default function AllyLayout({ children }: { children: ReactNode }) {
  const [initialSteps, setInitialSteps] = useState(defaultSteps);
  const [initialAppId, setInitialAppId] = useState("");

  useEffect(() => {
    // Only try to get from sessionStorage on client
    if (typeof window !== "undefined") {
      const storedApplicationId = sessionStorage.getItem("applicationId");
      if (storedApplicationId) {
        setInitialAppId(storedApplicationId);
      }
    }
  }, []); // Empty dependency array since this should only run once on mount

  return (
    <div className="layout">
      <ApplicationProvider
        initialSteps={initialSteps}
        initialAppId={initialAppId}
      >
        <ApplicationLoader>
          <div className={styles.sidebar}>
            <AllyContainer />
          </div>
          {/* This is the "outlet" where nested routes will render */}
          <div className={styles.outlet}>{children}</div>
        </ApplicationLoader>
      </ApplicationProvider>
    </div>
  );
}
