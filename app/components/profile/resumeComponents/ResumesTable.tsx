import styles from './resumeStyles.module.css'
import { ResumeType } from "@/app/utils/responseSchemas";
import ResumeItem from "./ResumeItem";

export default function ResumesTable({resumes, setRefresh}: {resumes: ResumeType[], setRefresh: Function}) {
    return ( 
        <div data-testid="resume-table-container">
            <table className={styles.resumesTable} role="table">
                <thead role="rowgroup">
                    <tr>
                        <th className={styles.tableHead}>Name</th>
                        <th className={styles.tableHead}>Date Uploaded</th>
                        <th className={styles.tableHead}></th>
                        <th className={styles.tableHead}></th>
                    </tr>
                </thead>
                <tbody role="rowgroup">
                    {resumes && resumes.map((resume) => (
                        <ResumeItem key={resume.eTag} resume={resume} setRefresh={setRefresh} />
                    ))}
                </tbody>
            </table>
            {/* Hidden button for testing */}
            <button 
                data-testid="refresh-trigger" 
                onClick={() => setRefresh(true)} 
                style={{ display: 'none' }}
            />
        </div>
    )
}