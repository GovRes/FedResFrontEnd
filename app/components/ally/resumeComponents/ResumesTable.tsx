import styles from "../ally.module.css";
import { ResumeType } from "@/app/utils/responseSchemas";
import ResumeItem from "./ResumeItem";

export default function ResumesTable({
  resumes,
  selectedResumes,
  setRefresh,
  setSelectedResumes,
}: {
  resumes: ResumeType[];
  selectedResumes: ResumeType[];
  setRefresh: Function;
  setSelectedResumes: Function;
}) {
  return (
    <div>
      <table className={styles.resumesTable} role="table">
        <thead role="rowgroup">
          <tr>
            <th className="tableHead"></th>
            <th className="tableHead">Name</th>
            <th className="tableHead">Date Uploaded</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {resumes &&
            resumes.map((resume) => (
              <ResumeItem
                key={resume.eTag}
                resume={resume}
                setRefresh={setRefresh}
                selectedResumes={selectedResumes}
                setSelectedResumes={setSelectedResumes}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}
