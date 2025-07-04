import { useEffect, useState } from "react";
import {
  handleUpdateUserAttribute,
  updateUserTypeAttribute,
  UserType,
} from "@/app/utils/userAttributeUtils";
import SubmitCancelButtonArray from "./SubmitCancelButtonArray";
import EditButton from "./EditButton";
import EditableAttributeContainer from "./EditableAttributeContainer";
import styles from "./editableAttributeStyles.module.css";

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
    console.log("Updating", attributeKey, "to", formValue);

    const response = await updateUserTypeAttribute(attributeKey, formValue);
    if (response === "200") {
      console.log("API success, updating local state");
      // Call setAttributes with the update data directly
      await setAttributes({
        [attributeKey]: formValue,
      });
      cancelEdit();
    } else {
      console.log("API failed:", response);
      return response;
    }
  }
  return (
    <EditableAttributeContainer title={title}>
      {showEdit ? (
        <form className={styles.attributeForm} onSubmit={submit}>
          <select defaultValue={value} onChange={onChange}>
            {Object.keys(options).map((key) => {
              return (
                <option key={key} value={key}>
                  {options[key]}
                </option>
              );
            })}
          </select>

          <SubmitCancelButtonArray cancelEdit={cancelEdit} />
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
