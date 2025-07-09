import { GrCheckmark, GrClose } from "react-icons/gr";
import styles from "./editableAttributeStyles.module.css";

export default function SubmitCancelButtonArray({
  cancelEdit,
}: {
  cancelEdit: () => void;
}) {
  return (
    <>
      <button
        type="submit"
        className={`${styles.attributeIcon} ${styles.submitButton}`}
      >
        <GrCheckmark />
      </button>
      <button
        className={`${styles.attributeIcon} ${styles.cancelButton}`}
        onClick={() => cancelEdit()}
      >
        <GrClose />
      </button>
    </>
  );
}
