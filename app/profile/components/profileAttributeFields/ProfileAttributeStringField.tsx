import { useEffect, useState } from "react";
import { GrCheckmark, GrClose, GrEdit } from "react-icons/gr";
import styles from "../../profileStyles.module.css";
import { handleUpdateUserAttribute } from "@/app/utils/userAttributeInterface";

export default function ProfileAttributeStringField({
  attributeKey,
  title,
  value,
  setAttributes,
}: {
  attributeKey: string;
  title: string;
  value: string;
  setAttributes: Function;
}) {
  const [formValue, setFormValue] = useState(value);
  const [showEdit, setShowEdit] = useState(false);

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
      setShowEdit(false);
    } else {
      return response;
    }
  }

  return (
    <div className={styles.editableContainer}>
      <span className={styles.attributeTitle}>{title}: </span>
      {showEdit ? (
        <form className={styles.form} onSubmit={submit}>
          <input onChange={onChange} value={formValue} />

          <button
            type="submit"
            className={`${styles.icon} ${styles.submitButton}`}
          >
            <GrCheckmark />
          </button>
          <button
            className={`${styles.icon} ${styles.cancelButton}`}
            onClick={() => setShowEdit(false)}
          >
            <GrClose />
          </button>
        </form>
      ) : (
        <span>
          {value}
          <span onClick={() => setShowEdit(true)} className={styles.icon}>
            <GrEdit />
          </span>
        </span>
      )}
    </div>
  );
}
