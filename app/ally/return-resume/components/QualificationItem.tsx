import { QualificationType } from "@/lib/utils/responseSchemas";
import styles from "../resume.module.css";
export default function qualificationItem({
  qualification,
}: {
  qualification: QualificationType;
}) {
  return (
    <div className={styles.resumeItem}>
      {qualification.title.toUpperCase()}. {qualification.paragraph}
    </div>
  );
}
