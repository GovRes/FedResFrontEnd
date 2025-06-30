import { useEffect, useState } from "react";
import { handleUpdateUserAttribute } from "@/app/utils/userAttributeUtils";
import EditableAttributeContainer from "./EditableAttributeContainer";
import SubmitCancelButtonArray from "./SubmitCancelButtonArray";
import EditButton from "./EditButton";
import styles from "./editableAttributeStyles.module.css";

export default function EditableAttributeStringField({
  attributeKey,
  currentlyEditing,
  title,
  value,
  setAttributes,
  setCurrentlyEditing,
}: {
  attributeKey: string;
  currentlyEditing: string | null;
  title: string;
  value: string;
  setAttributes: Function;
  setCurrentlyEditing: (key: string | null) => void;
}) {
  const [formValue, setFormValue] = useState(value);
  const showEdit = currentlyEditing === attributeKey;

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

  async function submit(e: { preventDefault: () => void; target: any }) {
    e.preventDefault();
    const response = await handleUpdateUserAttribute(attributeKey, formValue);
    if (response === "200") {
      setAttributes((prev: any) => ({ ...prev, [attributeKey]: formValue }));
      cancelEdit();
    } else {
      return response;
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
          <SubmitCancelButtonArray cancelEdit={cancelEdit} />
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
