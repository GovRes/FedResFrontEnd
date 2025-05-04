import { PastJobQualificationType } from "@/app/utils/responseSchemas";
import styles from "../resume.module.css";
export default function pastJobQualificationItem({
  pastJobQualification,
}: {
  pastJobQualification: PastJobQualificationType;
}) {
  return (
    <div className={styles.resumeItem}>
      {pastJobQualification.title.toUpperCase()}.{" "}
      {pastJobQualification.paragraph}
    </div>
  );
}
