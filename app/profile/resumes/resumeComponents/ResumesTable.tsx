import styles from "./resumeStyles.module.css";
import { ResumeType } from "@/app/utils/responseSchemas";
import ResumeItem from "./ResumeItem";

export default function ResumesTable({
  resumes,
  setRefresh,
}: {
  resumes: ResumeType[];
  setRefresh: Function;
}) {
  return (
    <div>
      <table className={styles.resumesTable} role="table">
        <thead role="rowgroup">
          <tr>
            <th className="tableHead">Name</th>
            <th className="tableHead">Date Uploaded</th>
            <th className="tableHead"></th>
            <th className="tableHead"></th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {resumes &&
            resumes.map((resume) => (
              <ResumeItem
                key={resume.eTag}
                resume={resume}
                setRefresh={setRefresh}
              />
            ))}
        </tbody>
      </table>
      {/* Hidden button for testing */}
      <button
        data-testid="refresh-trigger"
        onClick={() => setRefresh(true)}
        style={{ display: "none" }}
      />
    </div>
  );
}
