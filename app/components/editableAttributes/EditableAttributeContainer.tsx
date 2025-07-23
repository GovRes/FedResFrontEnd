import styles from "./editableAttributeStyles.module.css";
export default function EditableAttributeContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={styles.editableContainer}>{children}</div>;
}
