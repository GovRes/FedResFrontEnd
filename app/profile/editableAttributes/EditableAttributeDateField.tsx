import { useEffect, useState } from "react";
import styles from "./editableAttributeStyles.module.css";
import {
  updateUserTypeAttribute,
  UserType,
} from "@/lib/utils/userAttributeUtils";
import EditButton from "../../components/editableAttributes/EditButton";
import SubmitCancelButtonArray from "../../components/editableAttributes/SubmitCancelButtonArray";
import EditableAttributeContainer from "../../components/editableAttributes/EditableAttributeContainer";
import { useAttributeUpdate } from "@/lib/hooks/useAttributeUpdate";
import LoadingButton from "../../components/editableAttributes/LoadingButton";

export default function EditableAttributeDateField({
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
    // Convert boolean to string for the API call
    const result = await submitAttributeUpdate(e, attributeKey, formValue);

    if (result) {
      // Handle error case
      console.error("Update failed:", result);
    }
  }

  return (
    <EditableAttributeContainer title={title}>
      {showEdit ? (
        <form className={styles.attributeForm} onSubmit={submit}>
          <input type="date" onChange={onChange} value={formValue} />

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
