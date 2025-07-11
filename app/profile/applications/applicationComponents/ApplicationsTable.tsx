import styles from "../../resumes/resumeComponents/resumeStyles.module.css";
import { ApplicationType } from "@/app/utils/responseSchemas";
import ApplicationItem from "./ApplicationItem";

export default function ApplicationsTable({
  applications,
  setApplications,
  setLoading,
}: {
  applications: ApplicationType[];
  setApplications: React.Dispatch<React.SetStateAction<ApplicationType[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div>
      <table className={styles.resumesTable} role="table">
        <thead role="rowgroup">
          <tr>
            <th className="tableHead">Name</th>
            <th className="tableHead">Status</th>
            <th className="tableHead"></th>
            <th className="tableHead"></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {applications &&
            applications.map((application: ApplicationType) => (
              <ApplicationItem
                key={application.id}
                application={application}
                setApplications={setApplications}
                setLoading={setLoading}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}
