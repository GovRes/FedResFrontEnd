"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import { ToggleWithLabel } from "@/app/components/forms/Inputs";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import styles from "./editableAttributeStyles.module.css";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";

// Schema for the boolean form
const booleanFieldSchema = z.object({
  value: z.boolean(),
});

type BooleanFormData = z.infer<typeof booleanFieldSchema>;

interface AdminEditableAttributeBooleanFieldProps {
  attributeKey: keyof UserProfile;
  currentlyEditing: string | null;
  title: string;
  value: boolean | string;
  updateUser: (updates: AdminUserUpdate) => Promise<boolean>;
  setCurrentlyEditing: (key: string | null) => void;
}

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
  } = useForm<BooleanFormData>({
    defaultValues: {
      value: boolValue,
    },
  });

  // Reset form when value changes
  useEffect(() => {
    reset({ value: boolValue });
  }, [value, reset, boolValue]);

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    reset({ value: boolValue }); // Reset to original value
  }

  async function onSubmit(data: BooleanFormData) {
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

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
  };

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
