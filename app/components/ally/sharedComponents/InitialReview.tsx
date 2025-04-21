import { AllyContext } from "@/app/providers";
import { FormEvent, useContext } from "react";
import {
  AwardType,
  EducationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import { getCheckboxValues } from "@/app/utils/formUtils";
import ReviewItemsList from "../sharedComponents/ReviewItemsList";

export default function InitialReview<
  T extends AwardType | EducationType | UserJobType
>({
  localItems,
  itemType,
  setLocalItems,
  setItemsStep,
}: {
  localItems: T[];
  itemType: string;
  setLocalItems: Function;
  setItemsStep: Function;
}) {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { job } = context;

  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.scrollTo(0, 0);
    const values = getCheckboxValues(event);
    // Filter out jobs whose IDs are in the values array
    const updatedItems = localItems.filter((item) => !values.includes(item.id));
    setLocalItems(updatedItems);
    if (updatedItems.length === 0) {
      setItemsStep("additional");
    } else {
      setItemsStep("details");
    }
  };

  if (localItems.length > 0 && job) {
    return (
      <ReviewItemsList
        itemType={itemType}
        job={job}
        localItems={localItems}
        onSubmit={onSubmit}
      />
    );
  } else {
    return <div>no items found</div>;
  }
}
