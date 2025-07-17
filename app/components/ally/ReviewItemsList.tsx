import { FormEvent, useEffect, useState } from "react";
import styles from "./ally.module.css";
import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { Checkboxes, SubmitButton } from "../forms/Inputs";
import BaseForm from "../forms/BaseForm";
import {
  generateHeadingText,
  pascalToSpaced,
} from "@/app/utils/stringBuilders";
import { useApplication } from "@/app/providers/applicationContext";
export default function ReviewItemsList<
  T extends AwardType | EducationType | PastJobType,
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
          These are the {pascalToSpaced(itemType)}s we found in your resume. If
          any don’t relate to this application, check the box to leave them out
          of your draft. Writing can take time and we want to concentrate your
          energy on only what’s useful{" "}
          {job && <>in your application for {job.title}</>}.
        </p>
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
