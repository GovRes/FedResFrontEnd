import { QualificationType } from "@/lib/utils/responseSchemas";
import styles from "../resume.module.css";
export default function qualificationItem({
  qualification,
}: {
  qualification: QualificationType;
}) {
  console.log(8, qualification);
  return (
    <div className={styles.resumeItem}>
      {qualification.title.toUpperCase()}. {qualification.paragraph}
      <ul></ul>
    </div>
  );
}
