import { FormEvent, useEffect, useState } from "react";
import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { getCheckboxValues } from "@/app/utils/formUtils";
import ReviewItemsList from "./ReviewItemsList";
import { associateItemsWithApplication } from "@/app/crud/application";
import { useApplication } from "@/app/providers/applicationContext";
import { Loader } from "../loader/Loader";
import SkipItems from "./SkipItems";
import { useNextStepNavigation } from "@/app/utils/nextStepNavigation";

export default function InitialReview<
  T extends AwardType | EducationType | PastJobType,
>({
  currentStepId,
  localItems,
  itemType,
  setLocalItems,
}: {
  currentStepId: string;
  localItems: T[];
  itemType:
    | "Award"
    | "Education"
    | "PastJob"
    | "VolunteerExperience"
    | "Resume";
  setLocalItems: Function;
}) {
  const [items, setItems] = useState<T[]>(localItems);
  useEffect(() => {
    setItems(localItems);
  }, [localItems]);

  const [loading, setLoading] = useState(false);

  const { completeStep, applicationId } = useApplication();
  const { navigateToNextIncompleteStep } = useNextStepNavigation();

  const onSubmit = async (selectedItems: T[]) => {
    // Update parent state with selected items
    setLocalItems(selectedItems);
    if (applicationId && items.length > 0) {
      setLoading(true);
      if (selectedItems.length > 0) {
        await associateItemsWithApplication({
          applicationId,
          items: selectedItems as unknown as { id: string }[],
          associationType:
            itemType === "VolunteerExperience" ? "PastJob" : itemType,
        });
      }

      await completeStep(currentStepId);
      navigateToNextIncompleteStep(currentStepId);
    }
  };

  if (loading) return <Loader text={`Saving ${itemType}s`} />;
  if (items.length === 0) {
    return <SkipItems currentStepId={currentStepId} itemType={itemType} />;
  }

  return (
    <ReviewItemsList
      itemType={itemType}
      localItems={items} // Use local state for rendering
      onSubmit={onSubmit}
    />
  );
}
