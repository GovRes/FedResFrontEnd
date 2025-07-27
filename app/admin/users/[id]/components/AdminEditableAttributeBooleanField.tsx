import { useEffect, useState } from "react";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import { Toggle } from "@/app/components/forms/Inputs";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import styles from "./editableAttributeStyles.module.css";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";

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
  const [formValue, setFormValue] = useState(value || "");
  const boolValue = value === true || value === "true";
  const [checked, setChecked] = useState(boolValue);
  const [loading, setLoading] = useState(false);
  const showEdit = currentlyEditing === attributeKey;

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setChecked(boolValue);
  }

  function onChange() {
    setChecked(!checked);
  }

  useEffect(() => {
    setChecked(value === true || value === "true");
  }, [value]);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the update object with only the field being changed
      const updates: AdminUserUpdate = {
        [attributeKey]: checked.toString(),
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
    <EditableAttributeContainer title={title}>
      {showEdit ? (
        <form className={styles.attributeForm} onSubmit={submit}>
          <Toggle checked={checked} onChange={onChange} />
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
