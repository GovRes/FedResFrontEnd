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
import { educationExtractorInstructions } from "@/lib/prompts/educationExtractorPrompt";
import { pastJobsExtractorInstructions } from "@/lib/prompts/pastJobsExtractorPrompt";
import { awardsExtractorInstructions } from "@/lib/prompts/awardsExtractorPrompt";
import { volunteersExtractorInstructions } from "@/lib/prompts/volunteersExtractorPrompt";

const client = generateClient<Schema>();

// Configuration for extraction operations
const EXTRACTION_CONFIG = {
  pdfScale: 2.0, // Higher resolution for better OCR
  imageQuality: 0.95,
  concurrentExtractions: true, // Process all extractions in parallel
  maxRetries: 2,
};

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
  const [existingRecords, setExistingRecords] = useState({
    awards: [] as AwardType[],
    educations: [] as EducationType[],
    pastJobs: [] as PastJobType[],
    volunteers: [] as PastJobType[], // Volunteers are stored as PastJob type
  });

  // Fetch all existing records in a single effect
  useEffect(() => {
    async function fetchExistingRecords() {
      try {
        const [awardsData, educationsData, pastJobsData] = await Promise.all([
          listUserModelRecords("Award", user.userId),
          listUserModelRecords("Education", user.userId),
          listUserModelRecords("PastJob", user.userId),
        ]);

        setExistingRecords({
          awards: awardsData.data?.items || [],
          educations: educationsData.data?.items || [],
          pastJobs:
            pastJobsData.data?.items?.filter(
              (job: any) => job.type !== "Volunteer"
            ) || [],
          volunteers:
            pastJobsData.data?.items?.filter(
              (job: any) => job.type === "Volunteer"
            ) || [],
        });
      } catch (error) {
        console.error("Failed to fetch existing records:", error);
      }
    }

    fetchExistingRecords();
  }, [user.userId]);

  // Unified extraction function with better error handling
  async function extractFromResume<T extends keyof typeof existingRecords>(
    extractorType: T,
    instructions: string,
    resumeImages?: string[],
    resumeText?: string,
    retryCount = 0
  ): Promise<any[]> {
    try {
      const results = await genericExtractor({
        resumeImages,
        resume: resumeText,
        existingRecords: existingRecords[extractorType],
        extractorType:
          extractorType === "volunteers" ? "pastJobs" : extractorType, // volunteers use pastJobs schema
        instructions,
      });

      if (results && results.length > 0) {
        // Map the correct model type for database storage
        const modelType =
          extractorType === "volunteers"
            ? "PastJob"
            : extractorType === "pastJobs"
              ? "PastJob"
              : extractorType === "educations"
                ? "Education"
                : "Award";

        await batchCreateModelRecords(modelType, results, user.userId);
        console.log(
          `Successfully extracted ${results.length} ${extractorType}`
        );
        return results;
      }
      return [];
    } catch (error) {
      console.error(`Error extracting ${extractorType}:`, error);

      // Retry logic for transient failures
      if (retryCount < EXTRACTION_CONFIG.maxRetries) {
        console.log(
          `Retrying ${extractorType} extraction (attempt ${retryCount + 1})`
        );
        return extractFromResume(
          extractorType,
          instructions,
          resumeImages,
          resumeText,
          retryCount + 1
        );
      }

      throw new Error(
        `Failed to extract ${extractorType} after ${EXTRACTION_CONFIG.maxRetries} retries: ${error}`
      );
    }
  }

  async function onSubmitResume({ fileName }: { fileName: string }) {
    try {
      const { errors, data: newResume } = await client.models.Resume.create(
        { fileName },
        { authMode: "userPool" }
      );

      if (errors) {
        console.error("Resume creation errors:", errors);
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
    } catch (error) {
      console.error("Failed to create resume record:", error);
    }
  }

  async function processResume() {
    if (!localResume) return;

    setLoading(true);

    try {
      let resumeImages: string[] = [];
      let resumeText: string = "";

      // Try vision approach first (better accuracy), fall back to text
      try {
        resumeImages = await convertPdfToImages(localResume);
        console.log(
          `Converted PDF to ${resumeImages.length} images for vision processing`
        );
      } catch (imageError) {
        console.warn(
          "Image conversion failed, falling back to text extraction:",
          imageError
        );
        resumeText = await processResumeToString(localResume);
        console.log(
          `Extracted ${resumeText.length} characters of text from PDF`
        );
      }

      // Process all extractions concurrently or sequentially based on config
      const extractionPromises = [
        extractFromResume(
          "awards",
          awardsExtractorInstructions,
          resumeImages,
          resumeText
        ),
        extractFromResume(
          "educations",
          educationExtractorInstructions,
          resumeImages,
          resumeText
        ),
        extractFromResume(
          "pastJobs",
          pastJobsExtractorInstructions,
          resumeImages,
          resumeText
        ),
        extractFromResume(
          "volunteers",
          volunteersExtractorInstructions,
          resumeImages,
          resumeText
        ),
      ];

      let results: any[][];

      if (EXTRACTION_CONFIG.concurrentExtractions) {
        // Process all extractions in parallel (faster but more resource intensive)
        results = await Promise.allSettled(extractionPromises).then(
          (outcomes) =>
            outcomes.map((outcome) =>
              outcome.status === "fulfilled" ? outcome.value : []
            )
        );
      } else {
        // Process extractions sequentially (slower but more stable)
        results = [];
        for (const promise of extractionPromises) {
          try {
            results.push(await promise);
          } catch (error) {
            console.error("Extraction failed:", error);
            results.push([]);
          }
        }
      }

      const [awardsResult, educationResult, pastJobsResult, volunteersResult] =
        results;

      const totalExtracted =
        awardsResult.length +
        educationResult.length +
        pastJobsResult.length +
        volunteersResult.length;

      console.log(
        `Resume processing completed. Extracted ${totalExtracted} total items:`,
        {
          awards: awardsResult.length,
          education: educationResult.length,
          pastJobs: pastJobsResult.length,
          volunteers: volunteersResult.length,
        }
      );
    } catch (error) {
      console.error("Resume processing error:", error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
      setShowUploader(false);
      setRefresh(true);
    }
  }

  async function convertPdfToImages(resume: ResumeType): Promise<string[]> {
    try {
      const fileUrl = await getFileUrl({ path: resume.path });
      if (!fileUrl) {
        throw new Error("Could not get file URL");
      }

      const response = await fetch(fileUrl.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const pdfArrayBuffer = await response.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
      const images: string[] = [];

      // Convert each page to canvas, then to image
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({
          scale: EXTRACTION_CONFIG.pdfScale,
        });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const imageDataUrl = canvas.toDataURL(
          "image/png",
          EXTRACTION_CONFIG.imageQuality
        );
        images.push(imageDataUrl);
      }

      return images;
    } catch (error) {
      console.error("Failed to convert PDF to images:", error);
      throw error;
    }
  }

  async function processResumeToString(resume: ResumeType): Promise<string> {
    try {
      const fileUrl = await getFileUrl({ path: resume.path });
      if (!fileUrl) {
        throw new Error("Could not get file URL");
      }

      const response = await fetch(fileUrl.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }

      const file = await response.blob();
      return await pdfToText(file);
    } catch (error) {
      console.error("Failed to extract text from PDF:", error);
      throw error;
    }
  }

  useEffect(() => {
    if (localResume) {
      processResume();
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
