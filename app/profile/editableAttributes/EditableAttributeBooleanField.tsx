import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import styles from "./editableAttributeStyles.module.css";
import { UserType } from "@/lib/utils/userAttributeUtils";
import { ToggleWithLabel } from "@/app/components/forms/Inputs";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import { useAttributeUpdate } from "@/lib/hooks/useAttributeUpdate";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";

// Schema for the boolean form
const booleanFieldSchema = z.object({
  value: z.boolean(),
});

type BooleanFormData = z.infer<typeof booleanFieldSchema>;

export default function EditableAttributeBooleanField({
  attributeKey,
  currentlyEditing,
  title,
  value,
  setAttributes,
  setCurrentlyEditing,
}: {
  attributeKey: keyof UserType;
  currentlyEditing: string | null;
  title: string;
  value: boolean | string;
  setAttributes: Function;
  setCurrentlyEditing: (key: string | null) => void;
}) {
  // Convert value to boolean consistently
  const boolValue = value === true || value === "true";
  const showEdit = currentlyEditing === attributeKey;
  const [loading, setLoading] = useState(false);
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
  } = useForm<BooleanFormData>({
    defaultValues: {
      value: boolValue,
    },
  });

  // Reset form when value changes
  useEffect(() => {
    reset({ value: boolValue });
  }, [value, reset, boolValue]);

  async function onSubmit(data: BooleanFormData) {
    // Convert boolean to string for the API call
    const result = await submitAttributeUpdate(
      { preventDefault: () => {} }, // Mock event object
      attributeKey,
      data.value.toString(),
      () => reset({ value: boolValue }) // Optional cleanup callback
    );

    if (result) {
      // Handle error case
      console.error("Update failed:", result);
    }
  }

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    reset({ value: boolValue }); // Reset to current value
  }

  return (
    <EditableAttributeContainer title={title}>
      {showEdit ? (
        <form
          className={styles.attributeForm}
          onSubmit={handleSubmit(onSubmit, onError)}
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
