import { useEffect, useState } from "react";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import styles from "./editableAttributeStyles.module.css";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";

interface AdminEditableAttributeSelectFieldProps {
  attributeKey: keyof UserProfile;
  currentlyEditing: string | null;
  options: Record<string, string>;
  title: string;
  value: string;
  updateUser: (updates: AdminUserUpdate) => Promise<boolean>;
  setCurrentlyEditing: (key: string | null) => void;
}

export default function AdminEditableAttributeStringField({
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

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setFormValue(value); // Reset form value on cancel
  }

  function onChange(e: { target: { value: string } }) {
    setFormValue(e.target.value);
  }

  useEffect(() => {
    setFormValue(value);
  }, [value]);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();

    console.log("🔧 Admin updating attribute:", attributeKey, "to:", formValue);

    setLoading(true);

    try {
      // Create the update object with only the field being changed
      const updates: AdminUserUpdate = {
        [attributeKey]: formValue || null,
      };

      console.log("📝 Admin update object:", updates);

      const success = await updateUser(updates);

      if (success) {
        console.log("✅ Admin update successful");
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
  console.log("options keys", Object.keys(options));

  return (
    <EditableAttributeContainer title={title}>
      {showEdit ? (
        <form className={styles.attributeForm} onSubmit={submit}>
          <select
            defaultValue={value}
            onChange={onChange}
            name={attributeKey}
            className={styles.attributeSelect}
          >
            {Object.keys(options).map((key) => {
              return (
                <option key={key} value={key}>
                  {options[key]}
                </option>
              );
            })}
          </select>

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
