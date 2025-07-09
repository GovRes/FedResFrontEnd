import { GrEdit } from "react-icons/gr";
import styles from "./editableAttributeStyles.module.css";
export default function EditButton({ startEdit }: { startEdit: Function }) {
  return (
    <span onClick={() => startEdit()} className={styles.attributeIcon}>
      <GrEdit />
    </span>
  );
}
