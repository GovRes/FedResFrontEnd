"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PastJobType,
  PastJobQualificationType,
} from "@/app/utils/responseSchemas";
import EditSingleJob from "@/app/components/ally/pastJobsComponents/EditSingleJob";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { getApplicationAssociations } from "@/app/crud/application";
import styles from "@/app/components/ally/ally.module.css";
import Sidebar from "@/app/components/ally/sharedComponents/DetailedListEditor/Sidebar";
import SidebarItem from "@/app/components/ally/sharedComponents/DetailedListEditor/SidebarItem";
import { fetchModelRecord } from "@/app/crud/genericFetch";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [pastJobs, setPastJobs] = useState<PastJobType[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(-1);
  const [currentItem, setCurrentItem] = useState<PastJobType | null>(null);

  const router = useRouter();
  const { applicationId, job } = useApplication();

  // Check if all qualifications are confirmed for a job
  function checkIfAllQualificationsConfirmed(job: PastJobType) {
    return job.pastJobQualifications?.every(
      (qualification: PastJobQualificationType) => qualification.userConfirmed
    );
  }

  // Fetch past jobs
  useEffect(() => {
    async function fetchPastJobs() {
      if (!applicationId) {
        console.log("No applicationId available yet");
        return;
      }

      setLoading(true);
      try {
        const pastJobsRes = await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        });

        console.log("Fetched past jobs in detail page:", pastJobsRes);

        if (pastJobsRes && pastJobsRes.length > 0) {
          setPastJobs(pastJobsRes);
        } else {
          console.log("No past jobs found in detail page");
        }
      } catch (error) {
        console.error("Error fetching past jobs in detail page:", error);
      } finally {
        setLoading(false);
      }
    }

    if (applicationId) {
      fetchPastJobs();
    }
  }, [applicationId]);

  useEffect(() => {
    console.log(83, pastJobs);
    if (!pastJobs.length) return;
    console.log(84, pastJobs);
    const jobIndex = pastJobs.findIndex((job) => job.id === id);
    console.log(`Looking for job with ID: ${id}, found at index: ${jobIndex}`);

    if (jobIndex >= 0) {
      console.log(89, jobIndex);
      setCurrentJobIndex(jobIndex);
      setCurrentItem(pastJobs[jobIndex]);
      setLoading(false);
    } else if (pastJobs.length > 0) {
      console.log(94);
      // If ID not found, redirect to first job
      console.log("ID not found, redirecting to first job:", pastJobs[0].id);
      router.replace(
        `/ally/past-experience/past-job-details/${pastJobs[0].id}`
      );
    }
  }, [id, pastJobs, router]);

  // Save functionality
  function savePastJob(item: PastJobType) {
    // Ensure we maintain the correct type structure
    const updatedItems = pastJobs.map((i) => {
      if (i.id !== item.id) return i;

      // For the item being updated, ensure pastJobQualifications is properly typed
      return {
        ...item,
        pastJobQualifications: Array.isArray(item.pastJobQualifications)
          ? item.pastJobQualifications
          : [],
      } as PastJobType;
    });

    setPastJobs(updatedItems);
  }

  // Navigate to next job with unconfirmed qualifications
  function navigateToNextUnconfirmedJob() {
    if (pastJobs.length === 0) return;

    // Start searching from current index + 1
    const startIndex =
      currentJobIndex + 1 < pastJobs.length ? currentJobIndex + 1 : 0;

    // Check each job starting from the next one
    for (let i = 0; i < pastJobs.length; i++) {
      const index = (startIndex + i) % pastJobs.length;
      const job = pastJobs[index];

      if (
        job.pastJobQualifications?.some((qual) => qual.userConfirmed === false)
      ) {
        router.push(`/ally/past-experience/past-job-details/${job.id}`);
        return;
      }
    }

    // If no jobs with unconfirmed qualifications found, stay on current job
    console.log("No jobs with unconfirmed qualifications found");
  }

  // Handle job selection
  const handleJobSelection = (index: number) => {
    if (pastJobs[index] && pastJobs[index].id) {
      router.push(
        `/ally/past-experience/past-job-details/${pastJobs[index].id}`
      );
    }
  };
  if (loading) {
    return <TextBlinkLoader text="Loading job experience details" />;
  }
  console.log(151, currentItem);
  return (
    <div className={styles.detailedListEditorContainer}>
      <h3>Connect your past experience to your future role at {job?.title}</h3>
      <div className={styles.detailedListEditorContent}>
        {/* Sidebar */}
        <Sidebar
          currentIndex={currentJobIndex}
          setCurrentIndex={handleJobSelection}
          items={pastJobs}
          titleText="Past Jobs"
        />

        {/* Content Area */}
        {currentItem &&
        Array.isArray(currentItem.pastJobQualifications) &&
        currentItem.pastJobQualifications.length > 0 ? (
          <EditSingleJob
            currentJobIndex={currentJobIndex}
            localPastJobs={pastJobs}
            pastJob={currentItem}
            pastJobsLength={pastJobs.length}
            setCurrentJobIndex={handleJobSelection}
            savePastJob={savePastJob}
            navigateToNextUnconfirmedJob={navigateToNextUnconfirmedJob}
          />
        ) : (
          <div className={styles.emptyStateContainer}>
            No job details available
          </div>
        )}
      </div>
    </div>
  );
}
