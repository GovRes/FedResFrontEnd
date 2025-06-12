import { generateClient } from "aws-amplify/api";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Uploader } from "@/app/components/forms/Uploader";
import type { Schema } from "../../../../amplify/data/resource"; // Path to your backend resource definition
import { awardsExtractor } from "@/app/components/aiProcessing/awardsExtractor";
import { batchCreateModelRecords } from "@/app/crud/genericCreate";
import { educationExtractor } from "@/app/components/aiProcessing/educationExtractor";
import { pastJobsExtractor } from "@/app/components/aiProcessing/pastJobsExtractor";
import { volunteersExtractor } from "@/app/components/aiProcessing/volunteersExtractor";
import { listUserModelRecords } from "@/app/crud/genericListForUser";
import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/app/utils/responseSchemas";
import { ResumeType } from "@/app/utils/responseSchemas";
import { useEffect, useState } from "react";
import { getFileUrl } from "@/app/utils/client-utils";
import pdfToText from "react-pdftotext";

const client = generateClient<Schema>();

export default function ResumeUploader({
  setLoading,
  setRefresh,
  setShowUploader,
}: {
  setLoading: Function;
  setRefresh: Function;
  setShowUploader: Function;
}) {
  const { user } = useAuthenticator();

  const [localResume, setLocalResume] = useState<ResumeType>();
  const [existingAwards, setExistingAwards] = useState<AwardType[]>([]);
  const [existingEducations, setExistingEducations] = useState<EducationType[]>(
    []
  );
  const [existingPastJobs, setExistingPastJobs] = useState<PastJobType[]>([]);

  useEffect(() => {
    async function fetchExistingAwards() {
      try {
        const result = await listUserModelRecords("Award", user.userId);
        if (result.items) {
          setExistingAwards(result.items);
        }
      } catch (error) {
        console.error("Failed to fetch educations:", error);
      }
    }
    async function fetchExistingEducations() {
      try {
        const result = await listUserModelRecords("Education", user.userId);
        if (result.items) {
          setExistingEducations(result.items);
        }
      } catch (error) {
        console.error("Failed to fetch educations:", error);
      }
    }
    async function fetchExistingPastJobs() {
      try {
        const result = await listUserModelRecords("PastJob", user.userId);

        if (result.items) {
          setExistingPastJobs(result.items);
        }
      } catch (error) {
        console.error("Failed to fetch past jobs:", error);
      }
    }

    fetchExistingAwards();
    fetchExistingEducations();
    fetchExistingPastJobs();
  }, []);

  async function fetchAwards({ resumeString }: { resumeString: string }) {
    let awards = await awardsExtractor({
      resume: resumeString,
      existingAwards,
    });
    if (awards && awards.length > 0) {
      await batchCreateModelRecords("Award", awards, user.userId);
      return awards;
    } else return [];
  }
  async function fetchEducation({ resumeString }: { resumeString: string }) {
    let educations = await educationExtractor({
      resume: resumeString,
      existingEducations,
    });
    if (educations && educations.length > 0) {
      await batchCreateModelRecords("Education", educations, user.userId);
      return educations;
    } else return [];
  }

  async function fetchPastJobs({ resumeString }: { resumeString: string }) {
    let pastJobs = await pastJobsExtractor({
      resume: resumeString,
      existingPastJobs,
    });
    if (pastJobs && pastJobs.length > 0) {
      await batchCreateModelRecords("PastJob", pastJobs, user.userId);

      return pastJobs;
    } else return [];
  }
  async function fetchVolunteers({ resumeString }: { resumeString: string }) {
    let volunteers = await volunteersExtractor({
      existingPastJobs,
      resume: resumeString,
    });
    if (volunteers && volunteers.length > 0) {
      await batchCreateModelRecords("Volunteer", volunteers, user.userId);
      return volunteers;
    } else return [];
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
    try {
      const resumePromise = await processResumeToString(localResume!);

      const [awardsResult, educationResult, pastJobsResult, volunteersResult] =
        await Promise.all([
          fetchAwards({ resumeString: resumePromise }),
          fetchEducation({ resumeString: resumePromise }),
          fetchPastJobs({ resumeString: resumePromise }),
          fetchVolunteers({ resumeString: resumePromise }),
        ]);
      if (
        awardsResult &&
        educationResult &&
        pastJobsResult &&
        volunteersResult
      ) {
        console.log("Resume processing complete");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function processResumeToString(resume: ResumeType) {
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
    async function findItemsFromResume() {
      await processResume();
      setShowUploader(false);
      setRefresh(true);
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
