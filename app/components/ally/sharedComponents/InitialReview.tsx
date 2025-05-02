import { useAlly } from "@/app/providers";
import { FormEvent, useEffect, useState } from "react";
import {
  AwardType,
  EducationType,
  UserJobType,
  VolunteerType,
} from "@/app/utils/responseSchemas";
import { getCheckboxValues } from "@/app/utils/formUtils";
import ReviewItemsList from "../sharedComponents/ReviewItemsList";
import { completeSteps } from "@/app/utils/stepUpdater";
import { useRouter } from "next/navigation";
import { associateItemsWithUserResume } from "@/app/crud/userResume";
import { useUserResume } from "@/app/providers/userResumeContext";
import { TextBlinkLoader } from "../../loader/Loader";

export default function InitialReview<
  T extends AwardType | EducationType | UserJobType | VolunteerType
>({
  currentStepId,
  localItems,
  itemType,
  setLocalItems,
  nextPath,
}: {
  currentStepId: string;
  localItems: T[];
  itemType:
    | "Award"
    | "Education"
    | "SpecializedExperience"
    | "UserJob"
    | "Volunteer"
    | "Resume";
  setLocalItems: Function;
  nextPath: string;
}) {
  console.log("loaded initial review");
  console.log(localItems);
  // Create a local state to track the items for rendering purposes
  const router = useRouter();
  const [items, setItems] = useState<T[]>(localItems);
  // Update local state whenever localItems prop changes
  useEffect(() => {
    setItems(localItems);
  }, [localItems]);

  const [loading, setLoading] = useState(false);

  const { job } = useAlly();
  const { steps, userResumeId, setSteps } = useUserResume();
  console.log("user resume", userResumeId);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = getCheckboxValues(event);
    console.log("submit called");
    // Filter out items whose IDs are in the values array
    const updatedItems = localItems.filter((item) => !values.includes(item.id));
    console.log("updatedItems", updatedItems);

    // Update parent state
    setLocalItems(updatedItems);
    if (userResumeId && items.length > 0) {
      console.log("associating items with user resume", userResumeId);
      setLoading(true);
      await associateItemsWithUserResume({
        userResumeId,
        items: updatedItems,
        associationType: itemType,
      });

      const updatedSteps = await completeSteps({
        steps,
        stepId: currentStepId,
        userResumeId,
      });
      setSteps(updatedSteps);
      router.push(nextPath);
    }
  };

  // Split the condition to better understand what's happening
  const hasItems = items.length > 0;
  const hasJob = Boolean(job);
  if (loading) return <TextBlinkLoader text={`Saving ${itemType}s`} />;
  if (hasItems && hasJob) {
    return (
      <ReviewItemsList
        itemType={itemType}
        localItems={items} // Use local state for rendering
        onSubmit={onSubmit}
      />
    );
  } else {
    // Add more details about why nothing is shown
    return (
      <div>
        {!hasItems && <p>No items found. The items list is empty.</p>}
        {!hasJob && <p>Job context is missing or undefined.</p>}
      </div>
    );
  }
}
