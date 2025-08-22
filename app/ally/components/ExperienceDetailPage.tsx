// FixedPastJobQualificationsPage.tsx
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditableParagraphProvider } from "@/app/providers/editableParagraphContext";
import ChatLayout from "@/app/components/chat/ChatLayout";
import { Loader } from "@/app/components/loader/Loader";
import { useApplication } from "@/app/providers/applicationContext";
import { getApplicationAssociations } from "@/lib/crud/application";
import { fetchPastJobWithQualifications } from "@/lib/crud/pastJob";
import { updateModelRecord } from "@/lib/crud/genericUpdate";
import {
  ApplicationType,
  PastJobType,
  QualificationType,
} from "@/lib/utils/responseSchemas";
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

  // Calculate if all qualifications are confirmed
  const allQualificationsConfirmed =
    pastJob?.qualifications?.every((q: QualificationType) => q.userConfirmed) ||
    false;

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
        const { data: pastJobs } = await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        });
        console.log("Fetched past jobs data:", pastJobs);
        // 2. Find the specific job by ID
        console.log("Looking for job with ID:", id);
        const pastJob = pastJobs?.find((j) => j.id === id);
        if (pastJob) {
          console.log("Found job:", pastJob);
          // 3. Ensure qualifications is properly formatted
          const formattedPastJob: PastJobType = {
            ...pastJob,
            qualifications: Array.isArray(pastJob.qualifications)
              ? pastJob.qualifications
                  .filter((qual: QualificationType) =>
                    qual.applicationIds?.includes(applicationId)
                  )
                  .map((qual: QualificationType) => ({
                    ...qual,
                    userConfirmed: qual.userConfirmed || false,
                  }))
              : [],
          };
          console.log("Formatted past job:", formattedPastJob);
          setPastJob(formattedPastJob);
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

  // NEW: Create a specialized save function for nested items that handles the parent-child relationship
  const saveNestedQualification = async (qualification: QualificationType) => {
    console.log("=== SAVING NESTED QUALIFICATION ===");
    console.log("Input qualification:", qualification);
    console.log(
      "Qualification being saved:",
      JSON.stringify(qualification, null, 2)
    );

    try {
      if (!pastJob) {
        console.error("No past job loaded");
        return Promise.reject(new Error("No past job loaded"));
      }

      // Use the generic update function to update just the qualification
      // Extract topicId properly - it's required and can't be empty
      const topicId = qualification.topic?.id || qualification.topicId;

      if (!topicId) {
        console.error(
          "Missing topicId - this is required for qualification update"
        );
        return Promise.reject(new Error("Missing required topicId"));
      }

      const qualificationUpdateData = {
        title: qualification.title || "",
        description: qualification.description || "",
        paragraph: qualification.paragraph || "",
        question: qualification.question || "",
        userConfirmed: qualification.userConfirmed || false,
        topicId: topicId,
        userId: qualification.userId || pastJob.userId,
      };

      console.log("Using generic update with data:", qualificationUpdateData);
      console.log("Extracted topicId:", topicId);

      let updateResult;
      try {
        updateResult = await updateModelRecord(
          "Qualification",
          qualification.id,
          qualificationUpdateData
        );
      } catch (detailedError) {
        console.error("Detailed error from updateModelRecord:", detailedError);
        if (
          detailedError &&
          typeof detailedError === "object" &&
          "errors" in detailedError
        ) {
          console.error("GraphQL Errors:", detailedError.errors);
          detailedError.errors.forEach((err: any, index: number) => {
            console.error(`GraphQL Error ${index + 1}:`, err.message);
          });
        }
        throw detailedError;
      }

      console.log("Generic update result:", updateResult);

      if (updateResult.success) {
        console.log("✅ Generic update successful");

        // Update local state
        const updatedJob = {
          ...pastJob,
          qualifications:
            pastJob.qualifications?.map((q: QualificationType) =>
              q.id === qualification.id ? qualification : q
            ) || [],
        };
        setPastJob(updatedJob);

        // Verify the save worked by fetching fresh data
        console.log("Fetching fresh data to verify save...");
        const verificationResult = await fetchPastJobWithQualifications(
          pastJob.id
        );
        if (verificationResult.success && verificationResult.data) {
          const freshQualification =
            verificationResult.data.qualifications?.find(
              (q: any) => q.id === qualification.id
            );
          if (freshQualification?.paragraph) {
            console.log(
              "✅ VERIFICATION: Paragraph persisted correctly:",
              freshQualification.paragraph.substring(0, 100) + "..."
            );
          } else {
            console.log("❌ VERIFICATION: Paragraph was NOT persisted");
            console.log("Fresh qualification object:", freshQualification);
          }
        }

        return Promise.resolve();
      } else {
        console.log("❌ Generic update failed:", updateResult.error);
        return Promise.reject(
          new Error(updateResult.error || "Failed to update qualification")
        );
      }
    } catch (error) {
      console.error("Error saving nested qualification:", error);
      return Promise.reject(error);
    }
  };

  // Check if there's a next unconfirmed job before navigating away
  const findNextJobWithUnconfirmedQualifications = async () => {
    if (!applicationId) return null;

    try {
      const { data: pastJobs } = await getApplicationAssociations({
        applicationId: applicationId,
        associationType: "PastJob",
      });

      // Find a job with at least one unconfirmed qualification
      return pastJobs?.find(
        (pjob) =>
          pjob.id !== pastJob?.id && // Not the current job
          pjob.qualifications?.some(
            (qual: QualificationType) => !qual.userConfirmed
          )
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
    return <Loader text="Loading job experience details" />;
  }
  // If no past job found
  if (
    !pastJob ||
    !pastJob.qualifications ||
    pastJob.qualifications.length === 0
  ) {
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
        items={pastJob.qualifications ?? []}
        currentStepId={currentStepId}
        saveFunction={saveNestedQualification}
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
        parentId={pastJob.id!}
        nestedItemsKey="qualifications"
        isEditMode={isEditingMode}
      />
    </EditableParagraphProvider>
  );
}
