import {
  UserJobQualificationType,
  UserJobType,
} from "@/app/utils/responseSchemas";
import UserJobQualificationItem from "./UserJobQualificationItem";
import styles from "../resume.module.css";

export default function VolunteerItem({
  volunteer,
}: {
  volunteer: UserJobType;
}) {
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
          <div className={styles.organization}>{volunteer.organization}</div>{" "}
          <div>EMPLOYER ADDRESS GOES HERE</div>
          <div className={styles.jobTitle}>{volunteer.title}</div>
          <div>Supervisor: [NAME] [PHONE NUMBER]</div>
          <div>(may contact)</div>
        </div>
        {/* column 2 */}
        <div>
          {volunteer.startDate && volunteer.endDate && (
            <div>{formatDates(volunteer.startDate, volunteer.endDate)}</div>
          )}
          <div>{volunteer.hours} hours per week</div>
          {volunteer.gsLevel && <div>{volunteer.gsLevel}</div>}
        </div>
        <div></div>
      </div>
      <div>
        {volunteer.userJobQualifications.map(
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
