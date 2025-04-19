import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import styles from "../resume.module.css";
export default function SpecializedExperienceItem({
  specializedExperience,
}: {
  specializedExperience: SpecializedExperienceType;
}) {
  return (
    <div className={styles.resumeItem}>
      {specializedExperience.title.toUpperCase()}.{" "}
      {specializedExperience.paragraph}
    </div>
  );
}
