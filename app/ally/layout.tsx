"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AllyContainer from "./components/AllyContainer";
import styles from "./ally.module.css";
import { ApplicationProvider } from "@/app/providers/applicationContext";
import { getApplicationWithJob } from "@/app/crud/application";
import { StepsType } from "@/app/utils/responseSchemas";
import { defaultSteps } from "@/app/providers/applicationContext";

export default function AllyLayout({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [initialSteps, setInitialSteps] = useState(defaultSteps);
  const [initialAppId, setInitialAppId] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Load data before rendering content
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);

      if (typeof window !== "undefined") {
        // Try to get applicationId from sessionStorage
        const storedApplicationId = sessionStorage.getItem("applicationId");

        if (storedApplicationId) {
          setInitialAppId(storedApplicationId);

          try {
            const applicationRes = await getApplicationWithJob({
              id: storedApplicationId,
            });

            if (applicationRes && applicationRes.completedSteps) {
              // Update initial steps based on the application response
              const updatedSteps = defaultSteps.map((step: StepsType) => ({
                ...step,
                completed: applicationRes.completedSteps.includes(step.id),
              }));

              setInitialSteps(updatedSteps);

              // If on root path, redirect to first incomplete step
              if (pathname === "/ally") {
                const nextIncompleteStep = updatedSteps.find(
                  (step) => !step.completed
                );
                if (nextIncompleteStep) {
                  router.push(`/ally${nextIncompleteStep.path}`);
                  // Keep loading true until redirect completes
                  return;
                }
              }
            }
          } catch (error) {
            console.error("Layout: Error loading application data:", error);
          }
        }
      }

      // Finished loading
      setIsLoading(false);
    }

    loadInitialData();
  }, [router, pathname]);

  // Loading state UI
  if (isLoading && pathname === "/ally") {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your application progress...</p>
      </div>
    );
  }

  // Normal layout once loaded or if not on root path
  return (
    <div className={styles.layout}>
      <ApplicationProvider
        initialSteps={initialSteps}
        initialAppId={initialAppId}
      >
        <div className={styles.sidebar}>
          <AllyContainer />
        </div>
        {/* This is the "outlet" where nested routes will render */}
        <div className={styles.outlet}>{children}</div>
      </ApplicationProvider>
    </div>
  );
}
