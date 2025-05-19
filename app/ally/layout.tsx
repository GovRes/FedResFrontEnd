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

// This component will be inside the ApplicationProvider
function ApplicationLoader({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { applicationId, setSteps } = useApplication();

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
            console.log(41, updatedSteps);

            // If on root path, redirect to first incomplete step
            if (pathname === "/ally") {
              const nextIncompleteStep = updatedSteps.find(
                (step) => !step.completed
              );
              console.log(45, nextIncompleteStep);
              if (nextIncompleteStep) {
                router.push(`/ally${nextIncompleteStep.path}`);
                // Keep loading true until redirect completes
                return;
              }
            }
          }
        } catch (error) {
          console.error(
            "ApplicationLoader: Error loading application data:",
            error
          );
        }
      }

      // Finished loading
      setIsLoading(false);
    }

    loadApplicationData();
  }, [applicationId, pathname, router, setSteps]);

  // Loading state UI
  if (isLoading && pathname === "/ally") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your application progress...</p>
      </div>
    );
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
    <div className={styles.layout}>
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
