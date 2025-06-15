// FixedPastJobQualificationsPage.tsx
import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditableParagraphProvider } from "@/app/providers/editableParagraphContext";
import ChatLayout from "@/app/components/chat/ChatLayout";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { getApplicationAssociations } from "@/app/crud/application";
import { updatePastJobWithQualifications } from "@/app/crud/pastJob";
import { PastJobType, QualificationType } from "@/app/utils/responseSchemas";
import { BaseItem } from "../../providers/chatContext";
import { usePastJobDetailsStep } from "@/app/providers/useApplicationStep";

export default function ExperienceDetailPage({
  assistantName,
  assistantInstructions,
  currentStepId,
  id,
}: {
  assistantName: string;
  assistantInstructions: string;
  currentStepId: string;
  id: string;
}) {
  const router = useRouter();
  const { applicationId, job } = useApplication();
  const [loading, setLoading] = useState(true);
  const [pastJob, setPastJob] = useState<PastJobType | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Check if we're coming from an edit action by looking for the 'edit=true' query param
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const editMode = urlParams.get("edit") === "true";
      setIsEditingMode(editMode);
    }
  }, []);

  // Get job ID from URL
  const getJobIdFromUrl = () => {
    const path = window.location.pathname;
    const match = path.match(/\/past-job-details\/([^\/]+)$/);
    return match && match[1];
  };

  // Calculate if all qualifications are confirmed
  const allQualificationsConfirmed =
    pastJob?.qualifications?.every((q) => q.userConfirmed) || false;

  // Only use the completion hook when not specifically in edit mode
  // This prevents the step from being marked as incomplete when editing
  const { isStepComplete } = usePastJobDetailsStep(
    isEditingMode ? undefined : allQualificationsConfirmed
  );

  // Fetch past job data
  useEffect(() => {
    async function fetchPastJob() {
      if (!applicationId) return;

      if (!id) {
        // No job ID in URL, redirect to the main page to find the next job
        router.push(`/ally/${currentStepId}`);
        return;
      }

      try {
        // 1. Get all past jobs for this application
        const pastJobs = (await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        })) as PastJobType[];
        console.log(pastJobs);
        // 2. Find the specific job by ID
        const job = pastJobs.find((j) => j.id === id);
        console.log("77", job?.qualifications);
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
          setLoading(false);
        } else {
          // Job not found - redirect to find the next job
          console.log("Job not found, redirecting");
          router.push(`/ally/${currentStepId}`);
        }
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

  // Check if there's a next unconfirmed job before navigating away
  const findNextJobWithUnconfirmedQualifications = async () => {
    if (!applicationId) return null;

    try {
      const pastJobs = (await getApplicationAssociations({
        applicationId: applicationId,
        associationType: "PastJob",
      })) as PastJobType[];

      // Find a job with at least one unconfirmed qualification
      return pastJobs.find(
        (job) =>
          job.id !== pastJob?.id && // Not the current job
          job.qualifications?.some((qual) => !qual.userConfirmed)
      );
    } catch (error) {
      console.error("Error finding next job:", error);
      return null;
    }
  };

  // This function handles completion and finding the next job
  const handleComplete = async () => {
    // If we're in edit mode, we need to remove the edit=true param when navigating
    if (isEditingMode) {
      // Just go back to the past-jobs page without the edit param
      router.push(`/ally/${currentStepId}`);
      return;
    }

    // Find the next job with unconfirmed qualifications
    const nextJob = await findNextJobWithUnconfirmedQualifications();

    if (nextJob) {
      // Navigate to the next job that needs work
      router.push(`/ally/${currentStepId}/${nextJob.id}`);
    } else {
      // All jobs are complete, move to the next step
      router.push(`/ally/${currentStepId}`);
    }
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

  // Render with the EditableParagraphProvider for editing support
  return (
    <EditableParagraphProvider>
      <ChatLayout
        additionalContext={[pastJob]}
        items={pastJob.qualifications}
        currentStepId={currentStepId}
        saveFunction={saveQualification}
        onComplete={handleComplete}
        assistantName={assistantName}
        assistantInstructions={`${assistantInstructions}

        PAST JOB CONTEXT:
        - Job Title: ${pastJob.title}
        - Organization: ${pastJob.organization}
        - Start Date: ${pastJob.startDate}
        - End Date: ${pastJob.endDate}
        - Hours: ${pastJob.hours}
        - GS Level: ${pastJob.gsLevel}
        - Responsibilities: ${pastJob.responsibilities}
        
        Use this context when asking questions and writing paragraphs.`}
        jobString={`${job?.title} at the ${job?.department}`}
        sidebarTitle={`Qualifications from ${pastJob.title} at ${pastJob.organization} that might apply to ${job?.title}`}
        heading={`${pastJob.title} at ${pastJob.organization} - Applicable Work Experience`}
        isNestedView={true}
        parentId={pastJob.id}
        nestedItemsKey="qualifications"
        isEditMode={isEditingMode}
      />
    </EditableParagraphProvider>
  );
}
