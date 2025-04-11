import {
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import UserJobQualificationItem from "./UserJobQualificationItem";
import styles from "../resume.module.css";

export default function UserJobItem({ userJob }: { userJob: UserJobType }) {
  function formatDates(startDate: string, endDate: string) {
    if (endDate === "present") {
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
          <div className={styles.organization}>{userJob.organization}</div>{" "}
          <div>EMPLOYER ADDRESS GOES HERE</div>
          <div className={styles.jobTitle}>{userJob.title}</div>
          <div>Supervisor: [NAME] [PHONE NUMBER]</div>
          <div>(may contact)</div>
        </div>
        {/* column 2 */}
        <div>
          {userJob.startDate && userJob.endDate && (
            <div>{formatDates(userJob.startDate, userJob.endDate)}</div>
          )}
          <div>{userJob.hours} hours per week</div>
          {userJob.gsLevel && <div>{userJob.gsLevel}</div>}
        </div>
        <div></div>
      </div>
      <div>
        {userJob.userJobQualifications.map(
          (qualification: UserJobQualificationType) => (
            <UserJobQualificationItem
              key={qualification.id}
              userJobQualification={qualification}
            />
          )
        )}
      </div>
    </div>
  );
}
