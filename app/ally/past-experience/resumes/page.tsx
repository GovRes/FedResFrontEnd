"use client";
import { list } from "aws-amplify/storage";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pdfToText from "react-pdftotext";
import styles from "@/app/components/ally/ally.module.css";
import ResumesTable from "@/app/components/ally/resumeComponents/ResumesTable";
import ResumeUploader from "@/app/profile/components/resumeComponents/ResumeUploader";
import { ResumeType } from "@/app/utils/responseSchemas";
import { getFileUrl } from "@/app/utils/client-utils";
import { TextBlinkLoader } from "@/app/components/loader/Loader";
import { useAlly } from "@/app/providers";
import { awardsExtractor } from "@/app/components/aiProcessing/awardsExtractor";
import { educationExtractor } from "@/app/components/aiProcessing/educationExtractor";
import { volunteersExtractor } from "@/app/components/aiProcessing/volunteersExtractor";
import { userJobsExtractor } from "@/app/components/aiProcessing/userJobsExtractor";
import { createAndSaveAwards } from "@/app/crud/award";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { createAndSaveEducations } from "@/app/crud/education";
import { createAndSavePositionRecords } from "@/app/crud/userJobAndVolunteer";
import { completeSteps } from "@/app/utils/stepUpdater";
import { useUserResume } from "@/app/providers/userResumeContext";

export default function ResumesPage() {
  const { setResumes } = useAlly();
  const { user } = useAuthenticator();
  const { steps, setSteps, userResumeId } = useUserResume();
  const router = useRouter();
  const [localResumes, setLocalResumes] = useState<ResumeType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResumes, setSelectedResumes] = useState<ResumeType[]>([]);
  const [refresh, setRefresh] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  async function processResumes() {
    setLoading(true);
    try {
      const resumePromises = selectedResumes.map(processResume);
      const resolvedResumes = await Promise.all(resumePromises);

      const [awardsResult, educationResult, userJobsResult, volunteersResult] =
        await Promise.all([
          fetchAwards({ resumeStrings: resolvedResumes }),
          fetchEducation({ resumeStrings: resolvedResumes }),
          fetchUserJobs({ resumeStrings: resolvedResumes }),
          fetchVolunteers({ resumeStrings: resolvedResumes }),
        ]);
      if (
        awardsResult &&
        educationResult &&
        userJobsResult &&
        volunteersResult
      ) {
        setResumes(resolvedResumes);
      }
      const updatedSteps = await completeSteps({
        steps,
        stepId: "past-experience",
        userResumeId,
      });
      setSteps(updatedSteps);
      router.push("/ally/past-experience/user-jobs");
    } catch (error) {
      console.log(error);
    } finally {
      console.log("process resume", userResumeId);
      setLoading(false);
    }
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
  async function fetchAwards({ resumeStrings }: { resumeStrings: string[] }) {
    let awards = await awardsExtractor({
      resumes: resumeStrings,
    });
    await createAndSaveAwards(awards, user.userId);
    return awards;
  }
  async function fetchEducation({
    resumeStrings,
  }: {
    resumeStrings: string[];
  }) {
    let educations = await educationExtractor({
      resumes: resumeStrings,
    });
    await createAndSaveEducations(educations, user.userId);
    return educations;
  }

  async function fetchUserJobs({ resumeStrings }: { resumeStrings: string[] }) {
    let userJobs = await userJobsExtractor({
      resumes: resumeStrings,
    });
    await createAndSavePositionRecords("UserJob", userJobs, user.userId);
    return userJobs;
  }
  async function fetchVolunteers({
    resumeStrings,
  }: {
    resumeStrings: string[];
  }) {
    let volunteers = await volunteersExtractor({
      resumes: resumeStrings,
    });
    await createAndSavePositionRecords("Volunteer", volunteers, user.userId);
    return volunteers;
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
    return <TextBlinkLoader text="Extracting info from your resume" />;
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
