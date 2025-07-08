import { useEffect, useState } from "react";
import { UserProfile, AdminUserUpdate } from "@/lib/types/user";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import styles from "./editableAttributeStyles.module.css";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";

interface AdminEditableAttributeCheckboxFieldProps {
  attributeKey: keyof UserProfile;
  currentlyEditing: string | null;
  options: Record<string, string>;
  title: string;
  value?: string[] | null | undefined;
  updateUser: (updates: AdminUserUpdate) => Promise<boolean>;
  setCurrentlyEditing: (key: string | null) => void;
}

export default function AdminEditableAttributeCheckboxField({
  attributeKey,
  currentlyEditing,
  options,
  title,
  value,
  updateUser,
  setCurrentlyEditing,
}: AdminEditableAttributeCheckboxFieldProps) {
  const [formValue, setFormValue] = useState<string[]>(
    Array.isArray(value) ? value : value ? [value] : []
  );
  const [loading, setLoading] = useState(false);
  const showEdit = currentlyEditing === attributeKey;

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setFormValue(Array.isArray(value) ? value : value ? [value] : []); // Reset form value on cancel
  }

  function onCheckboxChange(optionValue: string, checked: boolean) {
    setFormValue((prev: string[]) => {
      if (checked) {
        // Add the role if checked and not already present
        return prev.includes(optionValue) ? prev : [...prev, optionValue];
      } else {
        // Remove the role if unchecked
        return prev.filter((role) => role !== optionValue);
      }
    });
  }

  useEffect(() => {
    setFormValue(Array.isArray(value) ? value : value ? [value] : []);
  }, [value]);

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();

    console.log("🔧 Admin updating attribute:", attributeKey, "to:", formValue);

    setLoading(true);

    try {
      // Create the update object with only the field being changed
      const updates: AdminUserUpdate = {
        [attributeKey]: formValue.length > 0 ? formValue : null,
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
  const displayValue =
    value && value.length > 0
      ? value.map((key: string | number) => options[key] || key).join(", ")
      : "No roles assigned";
  console.log("keys", options ? Object.keys(options) : "No options provided");
  return (
    <EditableAttributeContainer title={title}>
      {showEdit ? (
        <form className={styles.attributeForm} onSubmit={submit}>
          <div className={styles.checkboxContainer}>
            {Object.entries(options).map(([optionValue, displayLabel]) => (
              <label key={optionValue} className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formValue.includes(optionValue)}
                  onChange={(e) =>
                    onCheckboxChange(optionValue, e.target.checked)
                  }
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>{displayLabel}</span>
              </label>
            ))}
          </div>

          {loading ? (
            <LoadingButton />
          ) : (
            <SubmitCancelButtonArray cancelEdit={cancelEdit} />
          )}
        </form>
      ) : (
        <span>
          {displayValue}
          <EditButton startEdit={startEdit} />
        </span>
      )}
    </EditableAttributeContainer>
  );
}
