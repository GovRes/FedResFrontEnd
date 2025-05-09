import { generateClient } from "aws-amplify/api";
import { Uploader } from "@/app/components/forms/Uploader";
import type { Schema } from "../../../../amplify/data/resource"; // Path to your backend resource definition
import { awardsExtractor } from "@/app/components/aiProcessing/awardsExtractor";
import { createAndSaveAwards } from "@/app/crud/award";
import { educationExtractor } from "@/app/components/aiProcessing/educationExtractor";
import { pastJobsExtractor } from "@/app/components/aiProcessing/pastJobsExtractor";
import { createAndSaveEducations } from "@/app/crud/education";
import { createAndSavePositionRecords } from "@/app/crud/pastJobAndVolunteer";
import { volunteersExtractor } from "@/app/components/aiProcessing/volunteersExtractor";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { ResumeType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { getFileUrl } from "@/app/utils/client-utils";
import pdfToText from "react-pdftotext";

const client = generateClient<Schema>();

export default function ResumeUploader({
  setRefresh,
  setShowUploader,
}: {
  setRefresh: Function;
  setShowUploader: Function;
}) {
  const { user } = useAuthenticator();
  const [loading, setLoading] = useState(false);
  const [localResume, setLocalResume] = useState<ResumeType>();

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

  async function fetchPastJobs({ resumeStrings }: { resumeStrings: string[] }) {
    let PastJobs = await pastJobsExtractor({
      resumes: resumeStrings,
    });
    await createAndSavePositionRecords("PastJob", PastJobs, user.userId);
    return PastJobs;
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

  async function onSubmitResume({ fileName }: { fileName: string }) {
    const { errors, data: newResume } = await client.models.Resume.create(
      {
        fileName,
      },
      {
        authMode: "userPool",
      }
    );
    if (errors) {
      console.error(errors);
      return;
    }
    if (newResume) {
      console.log("Resume created", newResume);
      setRefresh(true);
      // setShowUploader(false);
      setLocalResume({
        ...newResume,
        path: newResume.fileName,
        lastModified: new Date(newResume.updatedAt || newResume.createdAt),
        eTag: "",
      } as ResumeType);
    }
  }

  async function processResume() {
    setLoading(true);
    console.log("Processing resume", localResume);
    try {
      const resumePromise = await processResumeToString(localResume!);

      const [awardsResult, educationResult, PastJobsResult, volunteersResult] =
        await Promise.all([
          // tk make this one string at a time not an array
          fetchAwards({ resumeStrings: [resumePromise] }),
          fetchEducation({ resumeStrings: [resumePromise] }),
          fetchPastJobs({ resumeStrings: [resumePromise] }),
          fetchVolunteers({ resumeStrings: [resumePromise] }),
        ]);
      if (
        awardsResult &&
        educationResult &&
        PastJobsResult &&
        volunteersResult
      ) {
        setLoading(false);
        console.log("Resume processing complete");
      }
    } catch (error) {
      console.log(error);
    } finally {
    }
  }

  async function processResumeToString(resume: ResumeType) {
    console.log("Processing resume", resume);
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
    console.log("localResume", localResume);
    async function findItemsFromResume() {
      await processResume();
    }
    if (localResume) {
      findItemsFromResume();
    }
  }, [localResume]);
  return (
    <div>
      <div>
        <p>Please upload your resume. It needs to be in PDF format.</p>
      </div>
      <Uploader onSuccess={onSubmitResume} />
    </div>
  );
}
