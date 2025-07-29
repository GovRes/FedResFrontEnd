import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import styles from "./ally.module.css";
import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { Checkboxes, SubmitButton } from "../forms/Inputs";
import {
  generateHeadingText,
  pascalToSpaced,
} from "@/app/utils/stringBuilders";
import { useApplication } from "@/app/providers/applicationContext";

// Create a dynamic schema based on the items
const createReviewSchema = (itemIds: (string | number | undefined)[]) => {
  return z.object({
    excludedItems: z.array(z.union([z.string(), z.number()])).optional(),
  });
};

type ReviewFormData = {
  excludedItems?: (string | number)[];
};

export default function ReviewItemsList<
  T extends AwardType | EducationType | PastJobType,
>({
  itemType,
  localItems,
  onSubmit,
}: {
  itemType: string;
  localItems: T[];
  onSubmit: (selectedItems: T[]) => void;
}) {
  const { job } = useApplication();
  const [itemOptions, setItemOptions] = useState(
    localItems.map((item) => ({
      id: item.id!,
      name: generateHeadingText(item),
    }))
  );

  const itemIds = localItems?.map((item) => item.id!);

  const schema = createReviewSchema(itemIds);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      excludedItems: [],
    },
  });

  useEffect(() => {
    setItemOptions(
      localItems.map((item) => ({
        id: item.id!,
        name: generateHeadingText(item),
      }))
    );
  }, [localItems]);

  const handleFormSubmit = (data: ReviewFormData) => {
    const excludedIds = data.excludedItems || [];
    const selectedItems = localItems.filter(
      (item) => !excludedIds.includes(item.id!)
    );
    onSubmit(selectedItems);
  };

  return (
    <>
      <div className={styles.allyChatContainer}>
        <p>
          These are the {pascalToSpaced(itemType)}s we found in your resume. If
          any don't relate to this application, check the box to leave them out
          of your draft. Writing can take time and we want to concentrate your
          energy on only what's useful{" "}
          {job && <>in your application for {job.title}</>}.
        </p>
      </div>
      <div className={`${styles.userChatContainer} ${styles.fade}`}>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Checkboxes
            name="excludedItems"
            label="Select items to exclude"
            additionalClassName="negative"
            options={itemOptions}
            register={register}
            schema={schema}
            errors={errors}
          />
          <SubmitButton>Submit</SubmitButton>
        </form>
      </div>
    </>
  );
}
