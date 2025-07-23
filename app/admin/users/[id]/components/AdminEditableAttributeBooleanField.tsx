import { useEffect, useState } from "react";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import { ToggleWithLabel } from "@/app/components/forms/Inputs";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import styles from "./editableAttributeStyles.module.css";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";
import z from "zod";
import { useForm } from "react-hook-form";

interface AdminEditableAttributeBooleanFieldProps {
  attributeKey: keyof UserProfile;
  currentlyEditing: string | null;
  title: string;
  value: boolean | string;
  updateUser: (updates: AdminUserUpdate) => Promise<boolean>;
  setCurrentlyEditing: (key: string | null) => void;
}
const booleanFieldSchema = z.object({
  value: z.boolean(),
});
export default function AdminEditableAttributeBooleanField({
  attributeKey,
  currentlyEditing,
  title,
  value,
  updateUser,
  setCurrentlyEditing,
}: AdminEditableAttributeBooleanFieldProps) {
  const boolValue = value === true || value === "true";
  const [loading, setLoading] = useState(false);
  const showEdit = currentlyEditing === attributeKey;

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

  function startEdit() {
    setCurrentlyEditing(attributeKey);
    // Reset form with current value when starting edit
    reset({ value: boolValue });
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    reset({ value: boolValue });
  }

  useEffect(() => {
    // Update form when external value changes
    reset({ value: value === true || value === "true" });
  }, [value, reset]);

  async function onSubmit(data: { value: boolean }) {
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
