import { PastJobType, QualificationType } from "@/lib/utils/responseSchemas";
import QualificationItem from "./QualificationItem";

export default function PastJobItem({ pastJob }: { pastJob: PastJobType }) {
  console.log(7, pastJob);
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
    <div>
      <div>
        <div>{pastJob.organization}</div>{" "}
        {pastJob.organizationAddress && (
          <div>{pastJob.organizationAddress}</div>
        )}
        <div>{pastJob.title}</div>
        {pastJob.supervisorName && (
          <>
            <div>
              Supervisor: {pastJob.supervisorName} - {pastJob.supervisorPhone}
            </div>
            <div>
              {pastJob.supervisorMayContact ? (
                <span>May Contact</span>
              ) : (
                <span>Do Not Contact</span>
              )}
            </div>
          </>
        )}
      </div>
      {/* column 2 */}
      <div>
        {pastJob.startDate && pastJob.endDate && (
          <div>{formatDates(pastJob.startDate, pastJob.endDate)}</div>
        )}
        {pastJob.hours && <div>{pastJob.hours} hours per week</div>}
        {pastJob.gsLevel && <div>{pastJob.gsLevel}</div>}
      </div>
      {pastJob.qualifications.map((qualification: QualificationType) => (
        <QualificationItem
          key={qualification.id}
          qualification={qualification}
        />
      ))}
    </div>
  );
}
