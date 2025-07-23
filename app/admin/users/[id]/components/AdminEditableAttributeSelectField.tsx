import { useEffect, useState } from "react";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import { GenericFieldWithLabel } from "@/app/components/forms/Inputs";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import styles from "./editableAttributeStyles.module.css";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";
import { useForm } from "react-hook-form";
import z from "zod";

interface AdminEditableAttributeSelectFieldProps {
  attributeKey: keyof UserProfile;
  currentlyEditing: string | null;
  options: Record<string, string>;
  title: string;
  value: string;
  updateUser: (updates: AdminUserUpdate) => Promise<boolean>;
  setCurrentlyEditing: (key: string | null) => void;
}
const stringFieldSchema = z.object({
  value: z.string(),
});

export default function AdminEditableAttributeSelectField({
  attributeKey,
  currentlyEditing,
  options,
  title,
  value,
  updateUser,
  setCurrentlyEditing,
}: AdminEditableAttributeSelectFieldProps) {
  const [formValue, setFormValue] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const showEdit = currentlyEditing === attributeKey;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      value: formValue,
    },
  });
  function startEdit() {
    setCurrentlyEditing(attributeKey);
    reset({ value: formValue });
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setFormValue(value); // Reset form value on cancel
  }

  useEffect(() => {
    setFormValue(value);
  }, [value]);

  async function onSubmit(data: { value: string }) {
    setLoading(true);

    try {
      // Create the update object with only the field being changed
      const updates: AdminUserUpdate = {
        [attributeKey]: data.value.toString(),
      };

      const success = await updateUser(updates);

      if (success) {
        setCurrentlyEditing(null); // Exit edit mode
      } else {
        console.error("❌ Admin update failed");
        // Could add toast notification here
      }
    } catch (error) {
      console.error("❌ Admin update error:", error);
      // Could add error toast here
    } finally {
      setLoading(false);
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
            options={options}
            register={register}
            schema={stringFieldSchema}
          />

          {loading ? (
            <LoadingButton />
          ) : (
            <SubmitCancelButtonArray cancelEdit={cancelEdit} />
          )}
        </form>
      ) : (
        <span>
          {options[value]}
          <EditButton startEdit={startEdit} />
        </span>
      )}
    </EditableAttributeContainer>
  );
}
