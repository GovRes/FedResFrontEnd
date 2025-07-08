import { useEffect, useState } from "react";
import {
  handleUpdateUserAttribute,
  testDatabaseSync,
  testSimpleDatabaseUpdate,
  updateUserTypeAttribute,
  UserType,
} from "@/app/utils/userAttributeUtils";
import EditableAttributeContainer from "../../components/editableAttributes/EditableAttributeContainer";
import SubmitCancelButtonArray from "../../components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "../../components/editableAttributes/EditButton";
import styles from "./editableAttributeStyles.module.css";
import { useAttributeUpdate } from "@/lib/hooks/useAttributeUpdate";
import LoadingButton from "../../components/editableAttributes/LoadingButton";

export default function EditableAttributeStringField({
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
  value: string;
  setAttributes: Function;
  setCurrentlyEditing: (key: string | null) => void;
}) {
  const [formValue, setFormValue] = useState(value);
  const [loading, setLoading] = useState(false);
  const showEdit = currentlyEditing === attributeKey;
  const { submitAttributeUpdate } = useAttributeUpdate(
    setAttributes,
    setCurrentlyEditing,
    setLoading
  );

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setFormValue(value); // Reset form value on cancel
  }

  function onChange(e: { target: { value: any } }) {
    setFormValue(e.target.value);
  }
  useEffect(() => {
    setFormValue(value);
  }, [value]);

  async function submit(e: { preventDefault: () => void }) {
    console.log("🚀 Starting update process");
    console.log("📝 Updates to apply:", attributeKey, formValue);
    const result = await submitAttributeUpdate(e, attributeKey, formValue);
    console.log("✅ Update result:", result);
    if (result) {
      // Handle error case
      console.error("Update failed:", result);
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
          />
          {loading ? (
            <LoadingButton />
          ) : (
            <SubmitCancelButtonArray cancelEdit={cancelEdit} />
          )}
        </form>
      ) : (
        <span>
          {value}
          <EditButton startEdit={startEdit} />
        </span>
      )}
    </EditableAttributeContainer>
  );
}
