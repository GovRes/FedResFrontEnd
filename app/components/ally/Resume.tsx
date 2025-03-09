import { list } from "aws-amplify/storage";
import { useEffect, useState } from "react";
import pdfToText from "react-pdftotext";

import styles from "./ally.module.css";
import ResumesTable from "./resumeComponents/ResumesTable";
import ResumeUploader from "../profile/resumeComponents/ResumeUploader";
import { ResumeType } from "@/app/utils/responseSchemas";
import { getFileUrl } from "@/app/utils/client-utils";
import { TextBlinkLoader } from "../loader/Loader";

export default function Resumes({ setResumes }: { setResumes: Function }) {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading Resumes");
  const [localResumes, setLocalResumes] = useState<ResumeType[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<ResumeType[]>([]);
  const [refresh, setRefresh] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  async function processResumes() {
    setLoadingText("Processing Resumes");
    setLoading(true);
    let stringResumes = await selectedResumes.map(async (resume) => {
      return await processResume(resume);
    });
    const resolvedResumes = await Promise.all(stringResumes);
    setResumes(resolvedResumes);
    setLoading(false);
  }
  async function processResume(resume: ResumeType) {
    return await getFileUrl({ path: resume.path }).then(async (fileUrl) => {
      if (fileUrl) {
        const urlString = fileUrl.toString();
        const file = await fetch(urlString)
          .then((res) => res.blob())
          .catch((error) => console.error(error));
        if (file) {
          return pdfToText(file)
            .then((text) => {
              console.log(text);
              return text;
            })
            .catch((error) =>
              console.error("Failed to extract text from pdf", error)
            );
        }
      }
    });
  }
  useEffect(() => {
    async function getResumes() {
      setLoading(true);
      const result = await list({
        path: ({ identityId }) => `resumes/${identityId}/`,
        options: {
          bucket: "govRezUserData",
        },
      });
      setLoading(false);

      let sortedResult = result.items.sort(
        (a, b) =>
          (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0)
      );
      setLocalResumes(sortedResult as ResumeType[]);
    }
    if (refresh) {
      getResumes();
      setRefresh(false);
    }
  }, [refresh]);
  if (loading) {
    return <TextBlinkLoader text="Loading Resumes" />;
  }
  return (
    <div className={styles.resumesContainer}>
      <ResumesTable
        resumes={localResumes}
        selectedResumes={selectedResumes}
        setRefresh={setRefresh}
        setSelectedResumes={setSelectedResumes}
      />
      <div className={styles.formButtons}>
        <button onClick={() => setShowUploader(true)}>
          Upload a new resume
        </button>
        {showUploader && (
          <ResumeUploader
            setRefresh={setRefresh}
            setShowUploader={setShowUploader}
          />
        )}
        <button onClick={processResumes}>Use Selected Resumes</button>
      </div>
    </div>
  );
}
