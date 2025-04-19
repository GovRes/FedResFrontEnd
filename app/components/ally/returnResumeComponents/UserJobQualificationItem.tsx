import { UserJobQualificationType } from "@/app/utils/responseSchemas";
import styles from "../resume.module.css";
export default function UserJobQualificationItem({
  userJobQualification,
}: {
  userJobQualification: UserJobQualificationType;
}) {
  return (
    <div className={styles.resumeItem}>
      {userJobQualification.title.toUpperCase()}.{" "}
      {userJobQualification.paragraph}
    </div>
  );
}
