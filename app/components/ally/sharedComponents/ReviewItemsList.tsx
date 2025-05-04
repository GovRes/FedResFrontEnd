import { useAlly } from "@/app/providers";
import { FormEvent, useEffect, useState } from "react";
import styles from "../ally.module.css";
import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { Checkboxes, SubmitButton } from "../../forms/Inputs";
import BaseForm from "../../forms/BaseForm";
import { generateHeadingText } from "@/app/utils/stringBuilders";
import { useApplication } from "@/app/providers/applicationContext";
export default function ReviewItemsList<
  T extends AwardType | EducationType | PastJobType
>({
  itemType,
  localItems,
  onSubmit,
}: {
  itemType: string;
  localItems: T[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const { job } = useApplication();
  const [itemOptions, setItemOptions] = useState(
    localItems.map((item) => ({
      id: item.id,
      name: generateHeadingText(item),
    }))
  );

  useEffect(() => {
    setItemOptions(
      localItems.map((item) => ({
        id: item.id,
        name: generateHeadingText(item),
      }))
    );
  }, [localItems]);

  return (
    <>
      <div className={styles.allyChatContainer}>
        <p>
          Here are the {itemType}s we extracted from your resume. Please select
          any that you DO NOT think will be relevant{" "}
          {job && <>in your application for {job.title}</>}.
        </p>
        <p>Also remove any that are actually not {itemType}s.</p>
      </div>
      <div className={`${styles.userChatContainer} ${styles.fade}`}>
        <BaseForm onSubmit={onSubmit}>
          <Checkboxes additionalClassName="negative" options={itemOptions} />
          <SubmitButton type="submit">Submit</SubmitButton>
        </BaseForm>
      </div>
    </>
  );
}
