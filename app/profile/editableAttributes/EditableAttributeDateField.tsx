import { useEffect, useState } from "react";
import styles from "./editableAttributeStyles.module.css";
import { UserType } from "@/app/utils/userAttributeUtils";
import EditButton from "../../components/editableAttributes/EditButton";
import SubmitCancelButtonArray from "../../components/editableAttributes/SubmitCancelButtonArray";
import EditableAttributeContainer from "../../components/editableAttributes/EditableAttributeContainer";
import { useAttributeUpdate } from "@/lib/hooks/useAttributeUpdate";
import LoadingButton from "../../components/editableAttributes/LoadingButton";
import z from "zod";
import { useForm } from "react-hook-form";
import { GenericFieldWithLabel } from "@/app/components/forms/Inputs";
interface EditableAttributeDateFieldProps {
  attributeKey: keyof UserType;
  currentlyEditing: string | null;
  title: string;
  value: string;
  setAttributes: (updates: Partial<UserType>) => Promise<boolean>;
  setCurrentlyEditing: (key: string | null) => void;
}
const dateFieldSchema = z.object({
  value: z.string().date(),
});
export default function EditableAttributeDateField({
  attributeKey,
  currentlyEditing,
  title,
  value,
  setAttributes,
  setCurrentlyEditing,
}: EditableAttributeDateFieldProps) {
  const [formValue, setFormValue] = useState(value);
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
      value,
    },
  });
  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setFormValue(value); // Reset form value on cancel
  }

  useEffect(() => {
    reset({ value });
  }, [value]);

  async function onSubmit(data: { value: string }) {
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

  return (
    <EditableAttributeContainer>
      <span className={styles.attributeTitle}>{title}: </span>
      {showEdit ? (
        <form
          className={styles.attributeForm}
          onSubmit={handleSubmit(onSubmit)}
        >
          <GenericFieldWithLabel
            errors={errors}
            label={title}
            name="value"
            register={register}
            schema={dateFieldSchema}
          />
          {loading ? (
            <LoadingButton />
          ) : (
            <SubmitCancelButtonArray cancelEdit={cancelEdit} />
          )}
        </form>
      ) : (
        <span>
          {new Date(value).toLocaleDateString()}
          <EditButton startEdit={startEdit} />
        </span>
      )}
    </EditableAttributeContainer>
  );
}
