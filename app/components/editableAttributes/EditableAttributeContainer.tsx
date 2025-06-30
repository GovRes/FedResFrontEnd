import styles from "./editableAttributeStyles.module.css";
export default function EditableAttributeContainer({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.editableContainer}>
      <span className={styles.attributeTitle}>{title}: </span>
      {children}
    </div>
  );
}
