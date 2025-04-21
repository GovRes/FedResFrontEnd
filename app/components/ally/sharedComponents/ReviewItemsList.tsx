import { AllyContext } from "@/app/providers";
import { FormEvent, useContext, useEffect, useState } from "react";
import styles from "../ally.module.css";
import {
  AwardType,
  EducationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import { Checkboxes, SubmitButton } from "../../forms/Inputs";
import BaseForm from "../../forms/BaseForm";

export default function ReviewItemsList<
  T extends AwardType | EducationType | UserJobType
>({
  itemType,
  job,
  localItems,
  onSubmit,
}: {
  itemType: string;
  job: { title: string };
  localItems: T[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }

  const [itemOptions, setItemOptions] = useState(
    localItems.map((item) => ({
      id: item.id,
      name: item.title,
    }))
  );

  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }

  useEffect(() => {
    setItemOptions(
      localItems.map((item) => ({ id: item.id, name: item.title }))
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
