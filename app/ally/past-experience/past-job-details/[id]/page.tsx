"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// This component serves as an outlet page for individual job details
export default function JobDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [jobId, setJobId] = useState<string | null>(null);

  // Extract the job ID from the pathname instead of using params
  useEffect(() => {
    if (pathname) {
      const pathParts = pathname.split("/");
      const id = pathParts[pathParts.length - 1];
      if (id && id !== "past-job-details") {
        setJobId(id);
      }
    }
  }, [pathname]);

  // This is a layout-only page that routes to the parent
  // The actual content is managed by the parent page
  // based on the URL parameter
  useEffect(() => {
    // If we have a job ID but are not on the correct path, redirect
    if (jobId && !pathname?.includes("/past-job-details")) {
      router.push(`/past-job-details/${jobId}`);
    }
  }, [jobId, pathname, router]);

  // No need to render anything here as the parent component
  // will handle the actual content display
  return null;
}
