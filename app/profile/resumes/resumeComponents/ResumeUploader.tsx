import { generateClient } from "aws-amplify/api";
import { useAuthenticator } from "@aws-amplify/ui-react";
import * as pdfjsLib from "pdfjs-dist";
import { Uploader } from "@/app/components/forms/Uploader";
import type { Schema } from "../../../../amplify/data/resource";
import { batchCreateModelRecords } from "@/lib/crud/genericCreate";
import { listUserModelRecords } from "@/lib/crud/genericListForUser";
import {
  AwardType,
  EducationType,
  PastJobType,
} from "@/lib/utils/responseSchemas";
import { ResumeType } from "@/lib/utils/responseSchemas";
import { useEffect, useState } from "react";
import { getFileUrl } from "@/lib/utils/client-utils";
import pdfToText from "react-pdftotext";
import { genericExtractor } from "@/lib/aiProcessing/genericExtractor";
import { educationExtractorPrompt } from "@/lib/prompts/educationExtractorPrompt";
import { pastJobsExtractorPrompt } from "@/lib/prompts/pastJobsExtractorPrompt";
import { awardsExtractorPrompt } from "@/lib/prompts/awardsExtractorPrompt";

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
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

  const [localResume, setLocalResume] = useState<ResumeType>();
  const [existingAwards, setExistingAwards] = useState<AwardType[]>([]);
  const [existingEducations, setExistingEducations] = useState<EducationType[]>(
    []
  );
  const [existingPastJobs, setExistingPastJobs] = useState<PastJobType[]>([]);

  useEffect(() => {
    async function fetchExistingAwards() {
      try {
        const { data } = await listUserModelRecords("Award", user.userId);
        if (data && data.items) {
          setExistingAwards(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch awards:", error);
      }
    }
    async function fetchExistingEducations() {
      try {
        const { data } = await listUserModelRecords("Education", user.userId);
        if (data && data.items) {
          setExistingEducations(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch educations:", error);
      }
    }
    async function fetchExistingPastJobs() {
      try {
        const { data } = await listUserModelRecords("PastJob", user.userId);

        if (data && data.items) {
          setExistingPastJobs(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch past jobs:", error);
      }
    }

    fetchExistingAwards();
    fetchExistingEducations();
    fetchExistingPastJobs();
  }, []);

  async function fetchAwards({
    resumeImages,
    resume,
  }: {
    resumeImages?: string[];
    resume?: string;
  }) {
    let awards = await await genericExtractor({
      resumeImages,
      resume,
      existingRecords: existingAwards,
      extractorType: "awards",
      systemPrompt: awardsExtractorPrompt,
    });
    if (awards && awards.length > 0) {
      await batchCreateModelRecords("Award", awards, user.userId);
      return awards;
    } else return [];
  }

  async function fetchEducation({
    resumeImages,
    resume,
  }: {
    resumeImages?: string[];
    resume?: string;
  }) {
    let educations = await genericExtractor({
      resumeImages,
      resume,
      existingRecords: existingEducations,
      extractorType: "education",
      systemPrompt: educationExtractorPrompt,
    });
    if (educations && educations.length > 0) {
      await batchCreateModelRecords("Education", educations, user.userId);
      return educations;
    } else return [];
  }

  async function fetchPastJobs({
    resumeImages,
    resume,
  }: {
    resumeImages?: string[];
    resume?: string;
  }) {
    let pastJobs = await await genericExtractor({
      resumeImages,
      resume,
      existingRecords: existingPastJobs,
      extractorType: "pastJobs",
      systemPrompt: pastJobsExtractorPrompt,
    });
    if (pastJobs && pastJobs.length > 0) {
      await batchCreateModelRecords("PastJob", pastJobs, user.userId);
      return pastJobs;
    } else return [];
  }

  async function fetchVolunteers({
    resumeImages,
    resume,
  }: {
    resumeImages?: string[];
    resume?: string;
  }) {
    let volunteers = await genericExtractor({
      resumeImages,
      resume,
      existingRecords: existingPastJobs,
      extractorType: "pastJobs",
      systemPrompt: pastJobsExtractorPrompt,
    });
    if (volunteers && volunteers.length > 0) {
      await batchCreateModelRecords("PastJob", volunteers, user.userId);
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
      // Try vision approach first
      let resumeImages: string[] = [];
      let resumeText: string = "";

      try {
        resumeImages = await convertPdfToImages(localResume!);
      } catch (imageError) {
        console.error(
          "Image conversion failed, falling back to text extraction:",
          imageError
        );
        resumeText = await processResumeToString(localResume!);
      }

      const [awardsResult, educationResult, pastJobsResult, volunteersResult] =
        await Promise.all([
          fetchAwards({ resumeImages, resume: resumeText }),
          fetchEducation({ resumeImages, resume: resumeText }),
          fetchPastJobs({ resumeImages, resume: resumeText }),
          fetchVolunteers({ resumeImages, resume: resumeText }),
        ]);

      if (
        awardsResult &&
        educationResult &&
        pastJobsResult &&
        volunteersResult
      ) {
      }
    } catch (error) {
      console.error("Resume processing error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function convertPdfToImages(resume: ResumeType): Promise<string[]> {
    try {
      const fileUrl = await getFileUrl({ path: resume.path });
      if (!fileUrl) {
        throw new Error("Could not get file URL");
      }

      // Fetch the PDF
      const response = await fetch(fileUrl.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const pdfArrayBuffer = await response.arrayBuffer();

      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
      const images: string[] = [];

      // Convert each page to canvas, then to image
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        // Set up canvas with higher resolution for better OCR
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        // Create canvas element
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        // Convert canvas to base64 image
        const imageDataUrl = canvas.toDataURL("image/png", 0.95);
        images.push(imageDataUrl);
      }

      return images;
    } catch (error) {
      console.error("Failed to convert PDF to images:", error);
      throw error;
    }
  }

  // Keep as fallback method
  async function processResumeToString(resume: ResumeType): Promise<string> {
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
