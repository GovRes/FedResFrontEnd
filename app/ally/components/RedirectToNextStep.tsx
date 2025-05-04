"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApplication } from "@/app/providers/applicationContext";

export default function RedirectToNextStep() {
  const { steps, isReady } = useApplication();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only proceed if data is ready and we're on the root path
    if (isReady && pathname === "/ally") {
      console.log("Data is ready, finding next step");

      // Find the first uncompleted step
      const nextIncompleteStep = steps.find((step) => !step.completed);

      if (nextIncompleteStep) {
        console.log(
          "Redirecting to first incomplete step:",
          nextIncompleteStep.id
        );
        router.push(`/ally${nextIncompleteStep.path}`);
      } else if (steps.length > 0) {
        // If all steps are completed, go to the final step
        const finalStep = steps[steps.length - 1];
        console.log(
          "All steps complete, redirecting to final step:",
          finalStep.id
        );
        router.push(`/ally${finalStep.path}`);
      }
    }
  }, [isReady, steps, router, pathname]);

  return <div>Loading...</div>;
}
