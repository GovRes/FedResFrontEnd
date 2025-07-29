import { FormEvent, useEffect, useState } from "react";
import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import ReviewItemsList from "./ReviewItemsList";
import { completeSteps } from "@/app/utils/stepUpdater";
import { associateItemsWithApplication } from "@/app/crud/application";
import { useApplication } from "@/app/providers/applicationContext";
import { Loader } from "../loader/Loader";
import SkipItems from "./SkipItems";
import { navigateToNextIncompleteStep } from "@/app/utils/nextStepNavigation";
import { useRouter } from "next/navigation";

export default function InitialReview<
  T extends AwardType | EducationType | PastJobType
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
    | "SpecializedExperience"
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


  const { completeStep, steps, applicationId } = useApplication();
  const router = useRouter();


  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = getCheckboxValues(event);
    // Filter out items whose IDs are in the values array
    const updatedItems = localItems.filter((item) => !values.includes(item.id));

    // Update parent state
    setLocalItems(updatedItems);
    if (applicationId && items.length > 0) {
      setLoading(true);
      if (updatedItems.length > 0) {
        await associateItemsWithApplication({
          applicationId,
          items: updatedItems,
          associationType:
            itemType === "VolunteerExperience" ? "PastJob" : itemType,
        });
      }


      navigateToNextIncompleteStep({
        steps,
        router,
        currentStepId,
        applicationId,
        completeStep,
      });

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
