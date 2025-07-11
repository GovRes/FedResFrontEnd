import { useEffect, useState } from "react";
import ResumesTable from "./ResumesTable";
import ResumeUploader from "./ResumeUploader";
import { list } from "aws-amplify/storage";
import { ResumeType } from "@/app/utils/responseSchemas";
import { Loader } from "@/app/components/loader/Loader";

export default function ResumeDashboard() {
  const [resumes, setResumes] = useState<ResumeType[]>([]);
  const [refresh, setRefresh] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getResumes() {
      const result = await list({
        path: ({ identityId }) => `resumes/${identityId}/`,
        options: {
          bucket: "govRezUserData",
        },
      });

      let sortedResult = result.items.sort(
        (a, b) =>
          (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
      );
      setResumes(sortedResult as ResumeType[]);
    }
    if (refresh) {
      getResumes();
      setRefresh(false);
    }
  }, [refresh]);
  if (loading) {
    return <Loader text="loading resume data" />;
  }

  return (
    <div>
      <ResumesTable resumes={resumes} setRefresh={setRefresh} />
      <button onClick={() => setShowUploader(true)}>Upload a new resume</button>
      {showUploader && (
        <ResumeUploader
          setLoading={setLoading}
          setRefresh={setRefresh}
          setShowUploader={setShowUploader}
        />
      )}
    </div>
  );
}
