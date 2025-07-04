import { useEffect, useState } from "react";
import {
  handleUpdateUserAttribute,
  updateUserTypeAttribute,
  UserType,
} from "@/app/utils/userAttributeUtils";
import SubmitCancelButtonArray from "./SubmitCancelButtonArray";
import EditButton from "./EditButton";
import styles from "./editableAttributeStyles.module.css";
import EditableAttributeContainer from "./EditableAttributeContainer";

export default function EditableAttributeEmailField({
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
  const showEdit = currentlyEditing === attributeKey;

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

  async function submit(e: { preventDefault: () => void; target: any }) {
    e.preventDefault();
    const response = await updateUserTypeAttribute(attributeKey, formValue);
    if (response === "200") {
      // Call setAttributes with the update data directly
      await setAttributes({
        [attributeKey]: formValue,
      });
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
            type="email"
            onChange={onChange}
            value={formValue}
            name={title}
            className={styles.attributeEmail}
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
