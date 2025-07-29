import { useEffect, useState } from "react";
import styles from "./editableAttributeStyles.module.css";
import {
  handleUpdateUserAttribute,
  updateUserTypeAttribute,
  UserType,
} from "@/app/utils/userAttributeUtils";
import { Toggle } from "@/app/components/forms/Inputs";
import SubmitCancelButtonArray from "@/app/components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "@/app/components/editableAttributes/EditButton";
import EditableAttributeContainer from "@/app/components/editableAttributes/EditableAttributeContainer";
import { useAttributeUpdate } from "@/lib/hooks/useAttributeUpdate";
import LoadingButton from "@/app/components/editableAttributes/LoadingButton";

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
  const [checked, setChecked] = useState(boolValue);
  const [loading, setLoading] = useState(false);
  const { submitAttributeUpdate } = useAttributeUpdate(
    setAttributes,
    setCurrentlyEditing,
    setLoading
  );

  useEffect(() => {
    setChecked(value === true || value === "true");
  }, [value]);

  async function submit(e: { preventDefault: () => void }) {
    // Convert boolean to string for the API call
    const result = await submitAttributeUpdate(
      e,
      attributeKey,
      checked.toString(),
      () => setChecked(boolValue) // Optional cleanup callback
    );

    if (result) {
      // Handle error case
      console.error("Update failed:", result);
    }
  }

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setChecked(boolValue); // Reset to current value
  }

  function onChange() {
    setChecked(!checked);
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
