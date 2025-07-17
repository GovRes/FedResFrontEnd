"use client";
import ChatLayout from "@/app/components/chat/ChatLayout";
import { getApplicationAssociations } from "@/app/crud/application";
import { useApplication } from "@/app/providers/applicationContext";
import {
  PastJobType,
  SpecializedExperienceType,
} from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import {
  specializedExperienceAssistantInstructions,
  specializedExperienceAssistantName,
} from "@/app/prompts/specializedExperienceWriterPrompt";
import { Loader } from "@/app/components/loader/Loader";

export default function ExperienceWriterPage() {
  const [additionalContext, setAdditionalContext] = useState<PastJobType[]>([]);
  const [items, setItems] = useState<SpecializedExperienceType[]>([]);
  const [loading, setLoading] = useState(true);
  const { applicationId, completeStep, job, steps, setSteps } =
    useApplication();
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  useEffect(() => {
    async function fetchItems() {
      if (!applicationId) return;
      setLoading(true);
      try {
        const experienceRes = await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "SpecializedExperience",
        });
        if (experienceRes && experienceRes.length > 0) {
          const qualitativeExperiences = experienceRes.filter(
            (res) =>
              res.typeOfExperience === "experience" ||
              res.typeOfExperience === "other"
          );
          setItems(qualitativeExperiences as SpecializedExperienceType[]);
        }

        const pastJobRes = await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "PastJob",
        });
        if (pastJobRes && pastJobRes.length > 0) {
          setAdditionalContext(pastJobRes);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching items:", error);
        setLoading(false);
      }
    }
    fetchItems();
  }, [applicationId]);
  const saveItem = async (item: SpecializedExperienceType) => {
    try {
      // Call your API to save the item
      await updateModelRecord("SpecializedExperience", item.id, item);

      // Update local state
      setItems((prevItems) =>
        prevItems.map((i) => (i.id === item.id ? item : i))
      );

      return Promise.resolve();
    } catch (error) {
      console.error("Error saving item:", error);
      return Promise.reject(error);
    }
  };
  async function handleComplete() {
    await completeStep("specialized-experience-details");
    await navigateToNextIncompleteStep("specialized-experience-details");
  }
  if (loading) {
    return <Loader text="Loading specialized experiences" />;
  }
  return (
    <ChatLayout
      additionalContext={additionalContext}
      items={items}
      currentStepId="specialized-experience-details"
      saveFunction={saveItem}
      onComplete={handleComplete}
      assistantName={specializedExperienceAssistantName}
      assistantInstructions={specializedExperienceAssistantInstructions}
      jobString={`${job?.title} at the ${job?.department}`}
      sidebarTitle={`Specialized Experience for ${job?.title}`}
      heading={`Specialized Experience`}
      isNestedView={false}
    />
  );
}
