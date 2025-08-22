"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import AllyContainer from "./components/AllyContainer";
import styles from "./ally.module.css";
import {
  ApplicationProvider,
  useApplication,
} from "@/app/providers/applicationContext";
import { getApplicationWithJob } from "@/lib/crud/application";
import { StepsType } from "@/lib/utils/responseSchemas";
import { defaultSteps } from "@/app/providers/applicationContext";
import { Loader } from "../components/loader/Loader";

// Replace the ApplicationLoader component in layout.tsx with this:

function ApplicationLoader({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const {
    applicationId,
    setApplicationId,
    setInitialRedirectComplete,
    setSteps,
  } = useApplication();

  // Only check sessionStorage once on mount, not on every applicationId change
  useEffect(() => {
    if (typeof window !== "undefined" && !applicationId) {
      const storedApplicationId = sessionStorage.getItem("applicationId");
      if (storedApplicationId) {
        setApplicationId(storedApplicationId);
        return; // Exit early, let the next effect handle the data loading
      }
    }
  }, []); // Empty dependency array - only run once

  // Handle applicationId changes and data loading
  useEffect(() => {
    async function loadApplicationData() {
      setLoading(true);

      if (applicationId) {
        try {
          const { data: applicationRes } = await getApplicationWithJob({
            id: applicationId,
          });

          if (applicationRes && applicationRes.completedSteps) {
            const updatedSteps = defaultSteps.map((step: StepsType) => ({
              ...step,
              completed: applicationRes.completedSteps.includes(step.id),
            }));

            setSteps(updatedSteps);

            if (pathname === "/ally" || !pathname.includes("/ally/")) {
              const nextIncompleteStep = updatedSteps.find(
                (step) => !step.completed
              );
              if (nextIncompleteStep) {
                setInitialRedirectComplete(true);
                router.push(`/ally${nextIncompleteStep.path}`);
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
      } else if (pathname === "/ally") {
        setInitialRedirectComplete(true);
        router.push("/ally/usa-jobs");
        return;
      }

      setLoading(false);
    }

    loadApplicationData();
  }, [
    applicationId,
    pathname,
    router,
    setLoading,
    setSteps,
    setInitialRedirectComplete,
  ]);

  if (loading && pathname === "/ally") {
    return <Loader text="Loading your application progress..." />;
  }

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
