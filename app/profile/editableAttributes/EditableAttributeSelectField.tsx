import { useEffect, useState } from "react";
import { UserType } from "@/lib/utils/userAttributeUtils";
import SubmitCancelButtonArray from "../../components/editableAttributes/SubmitCancelButtonArray";
import EditButton from "../../components/editableAttributes/EditButton";
import EditableAttributeContainer from "../../components/editableAttributes/EditableAttributeContainer";
import styles from "./editableAttributeStyles.module.css";
import { useAttributeUpdate } from "@/lib/hooks/useAttributeUpdate";
import LoadingButton from "../../components/editableAttributes/LoadingButton";

export default function EditableAttributeSelectField({
  attributeKey,
  currentlyEditing,
  options,
  title,
  value,
  setAttributes,
  setCurrentlyEditing,
}: {
  attributeKey: keyof UserType;
  currentlyEditing: string | null;
  options: Record<string, string>;
  title: string;
  value: string;
  setAttributes: Function;
  setCurrentlyEditing: (key: string | null) => void;
}) {
  const [formValue, setFormValue] = useState(value);
  const showEdit = currentlyEditing === attributeKey;
  const [loading, setLoading] = useState(false);
  const { submitAttributeUpdate } = useAttributeUpdate(
    setAttributes,
    setCurrentlyEditing,
    setLoading
  );
  function onChange(e: { target: { value: any } }) {
    setFormValue(e.target.value);
  }
  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setFormValue(value); // Reset form value on cancel
  }
  useEffect(() => {
    setFormValue(value);
  }, [value]);

  async function submit(e: { preventDefault: () => void }) {
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
