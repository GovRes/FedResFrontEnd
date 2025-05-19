"use client";
import ChatLayout from "@/app/components/chat/ChatLayout";
import { getApplicationAssociations } from "@/app/crud/application";
import { useApplication } from "@/app/providers/applicationContext";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { updateModelRecord } from "@/app/crud/genericUpdate";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";
import { completeSteps } from "@/app/utils/stepUpdater";
import {
  specializedExperienceAssistantInstructions,
  specializedExperienceAssistantName,
} from "@/app/prompts/specializedExperienceWriterPrompt";
import { TextBlinkLoader } from "@/app/components/loader/Loader";

export default function ExperienceWriterPage() {
  const [items, setItems] = useState<SpecializedExperienceType[]>([]);
  const [loading, setLoading] = useState(true);
  const { applicationId, job, steps, setSteps } = useApplication();
  const { navigateToNextIncompleteStep } = useNextStepNavigation();
  useEffect(() => {
    async function fetchItems() {
      if (!applicationId) return;
      setLoading(true);
      try {
        const res = await getApplicationAssociations({
          applicationId: applicationId,
          associationType: "SpecializedExperience",
        });
        console.log(26, res);
        if (res && res.length > 0) {
          setItems(res as SpecializedExperienceType[]);
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
    const updatedSteps = await completeSteps({
      steps,
      stepId: "specialized-experience-details",
      applicationId,
    });
    setSteps(updatedSteps);
    await navigateToNextIncompleteStep("specialized-experience-details");
  }
  if (loading) {
    return <TextBlinkLoader text="Loading specialized experiences" />;
  }
  return (
    <ChatLayout
      items={items}
      currentStepId="specialized-experience-details"
      saveFunction={saveItem}
      onComplete={handleComplete}
      assistantName={specializedExperienceAssistantName}
      assistantInstructions={specializedExperienceAssistantInstructions}
      jobString={`${job?.title} at the ${job?.department}`}
      sidebarTitle={`Qualifications for ${job?.title}`}
      heading={`Specialized Experience`}
      isNestedView={false}
    />
  );
}
