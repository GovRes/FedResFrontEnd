// PastJobQualificationsPage.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatLayout from "@/app/components/chat/ChatLayout";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { getApplicationAssociations } from "@/app/crud/application";
import { updatePastJobWithQualifications } from "@/app/crud/pastJob";
import { PastJobType, QualificationType } from "@/app/utils/responseSchemas";
import { BaseItem } from "../../providers/chatContext";

export default function PastJobQualificationsPage() {
  const router = useRouter();
  const { applicationId, job } = useApplication();
  const [loading, setLoading] = useState(true);
  const [pastJob, setPastJob] = useState<PastJobType | null>(null);

  // Get job ID from URL
  const getJobIdFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/past-job-details\/([^\/]+)$/);
    return match && match[1];
  };

  // Fetch past job data
  useEffect(() => {
    async function fetchPastJob() {
      if (!applicationId) return;

      const jobId = getJobIdFromUrl();
      if (!jobId) {
        // No job ID in URL, redirect to the main page to find the next job
        router.push("/ally/past-experience/past-jobs");
        return;
      }

      try {
        // 1. Get all past jobs for this application
        const pastJobs = (await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        })) as PastJobType[];

        // 2. Find the specific job by ID
        const job = pastJobs.find((j) => j.id === jobId);

        if (job) {
          // 3. Ensure qualifications is properly formatted
          const formattedJob: PastJobType = {
            ...job,
            qualifications: Array.isArray(job.qualifications)
              ? job.qualifications.map((qual) => ({
                  ...qual,
                  userConfirmed: qual.userConfirmed || false,
                }))
              : [],
          };

          setPastJob(formattedJob);
        } else {
          // Job not found - redirect to find the next job
          router.push("/ally/past-experience/past-jobs");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching past job:", error);
        setLoading(false);
      }
    }

    if (applicationId) {
      fetchPastJob();
    }
  }, [applicationId, router]);

  // Save a qualification
  const saveQualification = async (qualification: QualificationType) => {
    try {
      if (!pastJob) {
        return Promise.reject(new Error("No past job loaded"));
      }

      // 1. Update the qualification in the pastJob
      const updatedJob = {
        ...pastJob,
        qualifications: pastJob.qualifications.map((q) =>
          q.id === qualification.id ? qualification : q
        ),
      };

      // 2. Save to backend API
      await updatePastJobWithQualifications(
        updatedJob.id,
        updatedJob,
        updatedJob.qualifications
      );

      // 3. Update local state
      setPastJob(updatedJob);

      return Promise.resolve();
    } catch (error) {
      console.error("Error saving qualification:", error);
      return Promise.reject(error);
    }
  };

  // This is the key function that handles completion and finding the next job
  const handleComplete = () => {
    // We simply redirect to /past-jobs, which will automatically find
    // the next job with unconfirmed qualifications
    router.push("/ally/past-experience/past-jobs");
  };

  // Display loading state
  if (loading) {
    return <TextBlinkLoader text="Loading job experience details" />;
  }

  // If no past job found
  if (!pastJob) {
    return (
      <div className="emptyState">
        <h3>Job not found</h3>
        <p>Redirecting to find the next job that needs work...</p>
      </div>
    );
  }

  // Render the ChatLayout with the qualifications as nested items
  return (
    <ChatLayout
      // The nested items (qualifications) go in the items prop
      items={pastJob.qualifications}
      // Save function for qualifications
      saveFunction={saveQualification}
      // Function to call when all qualifications are confirmed
      onComplete={handleComplete}
      // Assistant configuration
      assistantName="Ally"
      assistantInstructions={`Help the user write detailed paragraphs about their ${pastJob.title} experience at ${pastJob.organization} that demonstrate they have the qualifications needed for ${job?.title} at the ${job?.department}.`}
      jobString={`${job?.title} at the ${job?.department}`}
      // UI text
      sidebarTitle={`Qualifications for ${pastJob.title}`}
      heading={`${pastJob.title} at ${pastJob.organization} - Applicable Work Experience`}
      // Nested view configuration
      isNestedView={true}
      parentId={pastJob.id}
      nestedItemsKey="qualifications"
    />
  );
}
