import { useEffect, useState } from "react";
import ResumesTable from "./resumeComponents/ResumesTable";
import ResumeUploader from "./resumeComponents/ResumeUploader";
import { list } from "aws-amplify/storage";
import { ResumeType } from "@/app/utils/responseSchemas";

export default function ResumeDashboard() {
    const [resumes, setResumes] = useState<ResumeType[]>([])
    const [refresh, setRefresh] = useState(true)
    const [showUploader, setShowUploader] = useState(false)
    useEffect(() => {
        async function getResumes() {
            const result = await list({
                path: ({identityId}) => `resumes/${identityId}/`,
                options: {
                    bucket: 'govRezUserData'
                }
            });
            setResumes(result.items as ResumeType[])
        }
        if (refresh) {
            getResumes()
            setRefresh(false)
        }
    }, [refresh])
    return (<div>
        <ResumesTable resumes={resumes} setRefresh={setRefresh} />
        <button onClick={() => setShowUploader(true)}>Upload a new resume</button>
        {
            showUploader && <ResumeUploader setRefresh={setRefresh} setShowUploader={setShowUploader}/>
        }
        
        </div>)
}