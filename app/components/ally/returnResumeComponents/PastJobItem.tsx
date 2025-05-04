import {
  PastJobQualificationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import PastJobQualificationItem from "./PastJobQualificationItem";
import styles from "../resume.module.css";

export default function pastJobItem({ pastJob }: { pastJob: PastJobType }) {
  function formatDates(startDate: string, endDate: string) {
    if (endDate === "Present" || endDate === "present") {
      const start = new Date(startDate);
      return `${start.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })} - Present`;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`;
  }
  return (
    <div className={styles.jobItem}>
      <div className={styles.jobItemBasicInfo}>
        {/* column 1 */}
        <div>
          <div className={styles.organization}>{pastJob.organization}</div>{" "}
          <div>EMPLOYER ADDRESS GOES HERE</div>
          <div className={styles.jobTitle}>{pastJob.title}</div>
          <div>Supervisor: [NAME] [PHONE NUMBER]</div>
          <div>(may contact)</div>
        </div>
        {/* column 2 */}
        <div>
          {pastJob.startDate && pastJob.endDate && (
            <div>{formatDates(pastJob.startDate, pastJob.endDate)}</div>
          )}
          <div>{pastJob.hours} hours per week</div>
          {pastJob.gsLevel && <div>{pastJob.gsLevel}</div>}
        </div>
        <div></div>
      </div>
      <div>
        {pastJob.pastJobQualifications.map(
          (qualification: PastJobQualificationType) => (
            <PastJobQualificationItem
              key={qualification.id}
              pastJobQualification={qualification}
            />
          )
        )}
      </div>
    </div>
  );
}
