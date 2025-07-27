import { useEffect, useState } from "react";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import styles from "./editableAttributeStyles.module.css";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";

interface AdminEditableAttributeStringFieldProps {
  attributeKey: keyof UserProfile;
  currentlyEditing: string | null;
  title: string;
  value: string | null | undefined;
  updateUser: (updates: AdminUserUpdate) => Promise<boolean>;
  setCurrentlyEditing: (key: string | null) => void;
}

export default function AdminEditableAttributeStringField({
  attributeKey,
  currentlyEditing,
  title,
  value,
  updateUser,
  setCurrentlyEditing,
}: AdminEditableAttributeStringFieldProps) {
  const [formValue, setFormValue] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const showEdit = currentlyEditing === attributeKey;

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setFormValue(value || ""); // Reset form value on cancel
  }

  function onChange(e: { target: { value: string } }) {
    setFormValue(e.target.value);
  }

  useEffect(() => {
    setFormValue(value || "");
  }, [value]);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the update object with only the field being changed
      const updates: AdminUserUpdate = {
        [attributeKey]: formValue || null,
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
          <input
            onChange={onChange}
            value={formValue}
            name={title}
            className={styles.attributeText}
            disabled={loading}
          />
          {loading ? (
            <LoadingButton />
          ) : (
            <SubmitCancelButtonArray cancelEdit={cancelEdit} />
          )}
        </form>
      ) : (
        <span>
          {value || <em>Not set</em>}
          <EditButton startEdit={startEdit} />
        </span>
      )}
    </EditableAttributeContainer>
  );
}
