"use client";

import { ReactNode, useEffect, useState } from "react";
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

// This component will be inside the ApplicationProvider
function ApplicationLoader({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const {
    applicationId,
    initialRedirectComplete,
    setApplicationId,
    setInitialRedirectComplete,
    setSteps,
  } = useApplication();

  // Effect to check for sessionStorage changes
  useEffect(() => {
    const checkSessionStorage = () => {
      const storedApplicationId = sessionStorage.getItem("applicationId");
      // Only update if different from current applicationId
      if (storedApplicationId && storedApplicationId !== applicationId) {
        setApplicationId(storedApplicationId);
      }
    };

    // Check immediately and set up listener
    checkSessionStorage();

    // Create a storage event listener to detect changes
    const handleStorageChange = () => {
      checkSessionStorage();
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event for direct communication
    const handleCustomEvent = (e: CustomEvent) => {
      checkSessionStorage();
    };

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
  }, [applicationId, setApplicationId]);

  useEffect(() => {
    async function loadApplicationData() {
      setIsLoading(true);

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
        router.push("/ally/job-search");
        return; // Keep loading until redirect
      }

      // Finished loading
      setIsLoading(false);
    }

    loadApplicationData();
  }, [applicationId, pathname, router, setSteps, setInitialRedirectComplete]);

  // Loading state UI
  if (isLoading && pathname === "/ally") {
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
  }, []);

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
