import { useEffect, useState } from "react";
import styles from "./editableAttributeStyles.module.css";
import { UserType } from "@/app/utils/userAttributeUtils";
import { ToggleWithLabel } from "@/app/components/forms/Inputs";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import { useAttributeUpdate } from "@/lib/hooks/useAttributeUpdate";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";
import z from "zod";
import { useForm } from "react-hook-form";

interface EditableAttributeBooleanFieldProps {
  attributeKey: keyof UserType;
  currentlyEditing: string | null;
  title: string;
  value: boolean | string;
  setAttributes: (updates: Partial<UserType>) => Promise<boolean>;
  setCurrentlyEditing: (key: string | null) => void;
}
const booleanFieldSchema = z.object({
  value: z.boolean(),
});
export default function EditableAttributeBooleanField({
  attributeKey,
  currentlyEditing,
  title,
  value,
  setAttributes,
  setCurrentlyEditing,
}: EditableAttributeBooleanFieldProps) {
  // Convert value to boolean consistently
  const boolValue = value === true || value === "true";
  const [loading, setLoading] = useState(false);
  const showEdit = currentlyEditing === attributeKey;
  const { submitAttributeUpdate } = useAttributeUpdate(
    setAttributes,
    setCurrentlyEditing,
    setLoading
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      value: boolValue,
    },
  });
  useEffect(() => {
    // Update form when external value changes
    reset({ value: value === true || value === "true" });
  }, [value, reset]);

  async function onSubmit(data: { value: boolean }) {
    setLoading(true);
    const result = await submitAttributeUpdate(
      { preventDefault: () => {} },
      attributeKey,
      data.value.toString()
    );

    if (result) {
      // Handle error case
      console.error("Update failed:", result);
    }
  }

  function startEdit() {
    setCurrentlyEditing(attributeKey);
    // Reset form with current value when starting edit
    reset({ value: boolValue });
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    reset({ value: boolValue });
  }

  return (
    <EditableAttributeContainer>
      <span className={styles.attributeTitle}>{title}: </span>
      {showEdit ? (
        <form
          className={styles.attributeForm}
          onSubmit={handleSubmit(onSubmit)}
        >
          <ToggleWithLabel
            errors={errors}
            label={title}
            name="value"
            register={register}
            schema={booleanFieldSchema}
          />
          {loading ? (
            <LoadingButton />
          ) : (
            <SubmitCancelButtonArray cancelEdit={cancelEdit} />
          )}
        </form>
      ) : (
        <span>
          {boolValue ? "Yes" : "No"}
          <EditButton startEdit={startEdit} />
        </span>
      )}
    </EditableAttributeContainer>
  );
}
