import { EducationType } from "@/app/utils/responseSchemas";
import styles from "../resume.module.css";

export default function EducationExperienceItem({
  education,
}: {
  education: EducationType;
}) {
  function formatDates(date: string) {
    const gradDate = new Date(date);
    return `${gradDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`;
  }
  return (
    <div className={styles.jobItem}>
      <div className={styles.jobItemBasicInfo}>
        {/* column 1 */}
        <div>
          <div className={styles.degree}>{education.degree}</div>{" "}
          <div>{education.school}, [school city and state goes here]</div>
        </div>
        {/* column 2 */}
        <div>
          {education.date && (
            <div>Completion Date: {formatDates(education.date)}</div>
          )}
          <div>
            {education.gpa}GPA: {education.gpa}{" "}
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
}
