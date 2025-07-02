import { useEffect, useState } from "react";
import styles from "./editableAttributeStyles.module.css";
import {
  handleUpdateUserAttribute,
  updateUserTypeAttribute,
  UserType,
} from "@/app/utils/userAttributeUtils";
import { Toggle } from "@/app/components/forms/Inputs";
import SubmitCancelButtonArray from "./SubmitCancelButtonArray";
import EditButton from "./EditButton";
import EditableAttributeContainer from "./EditableAttributeContainer";

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
  const stringToBool = value === "true";
  const showEdit = currentlyEditing === attributeKey;
  const [checked, setChecked] = useState(stringToBool);
  useEffect(() => {
    setChecked(value === "true");
  }, [value]);
  async function submit(e: { preventDefault: () => void; target: any }) {
    e.preventDefault();
    const response = await updateUserTypeAttribute(
      attributeKey,
      checked.toString()
    );
    if (response === "200") {
      setAttributes((prev: any) => ({
        ...prev,
        [attributeKey]: checked.toString(),
      }));
      cancelEdit();
    } else {
      return response;
    }
  }

  function startEdit() {
    setCurrentlyEditing(attributeKey);
  }

  function cancelEdit() {
    setCurrentlyEditing(null);
    setChecked(stringToBool); // Reset form value on cancel
  }

  function onChange() {
    setChecked(!checked);
  }

  return (
    <EditableAttributeContainer title={title}>
      {showEdit ? (
        <form className={styles.attributeForm} onSubmit={submit}>
          <Toggle checked={checked} onChange={onChange} />
          <SubmitCancelButtonArray cancelEdit={cancelEdit} />
        </form>
      ) : (
        <span>
          {checked ? "Yes" : "No"}
          <EditButton startEdit={startEdit} />
        </span>
      )}
    </EditableAttributeContainer>
  );
}
