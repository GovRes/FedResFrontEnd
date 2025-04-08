import { list } from "aws-amplify/storage";
import { useContext, useEffect, useState } from "react";
import pdfToText from "react-pdftotext";

import styles from "./ally.module.css";
import ResumesTable from "./resumeComponents/ResumesTable";
import ResumeUploader from "../profile/resumeComponents/ResumeUploader";
import { ResumeType } from "@/app/utils/responseSchemas";
import { getFileUrl } from "@/app/utils/client-utils";
import { TextBlinkLoader } from "../loader/Loader";
import { setHeapSnapshotNearHeapLimit } from "v8";
import { AllyContext } from "@/app/providers";

export default function Resumes() {
  const context = useContext(AllyContext);
  if (!context) {
    throw new Error(
      "AllyContainer must be used within an AllyContext.Provider"
    );
  }
  const { setResumes, setStep, specializedExperiences } = context;
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Loading Resumes");
  const [localResumes, setLocalResumes] = useState<ResumeType[]>([]);
  const [selectedResumes, setSelectedResumes] = useState<ResumeType[]>([]);
  const [refresh, setRefresh] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  console.log({ specializedExperiences });
  async function processResumes() {
    setLoadingText("Processing Resumes");
    setLoading(true);
    let stringResumes = await selectedResumes.map(async (resume) => {
      return await processResume(resume);
    });
    const resolvedResumes = await Promise.all(stringResumes);
    setResumes(resolvedResumes);
    setLoading(false);
    setStep("specialized_experience");
  }

  async function processResume(resume: ResumeType) {
    return await getFileUrl({ path: resume.path }).then(async (fileUrl) => {
      if (fileUrl) {
        const urlString = fileUrl.toString();
        const file = await fetch(urlString)
          .then((res) => res.blob())
          .catch((error) => {
            console.error(error);
            return null;
          });
        if (file) {
          return pdfToText(file)
            .then((text) => {
              return text;
            })
            .catch((error) => {
              console.error("Failed to extract text from pdf", error);
              return "";
            });
        }
      }
      return "";
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
