import { sendMessages } from "@/lib/utils/api";

export const genericExtractor = async ({
  resumeImages,
  resume,
  existingRecords,
  extractorType,
  instructions,
}: {
  resumeImages?: string[];
  resume?: string;
  existingRecords: any[];
  extractorType: "pastJobs" | "educations" | "awards" | "volunteers";
  instructions: string;
}) => {
  // Use Vision API if images available, otherwise fall back to text
  if (resumeImages && resumeImages.length > 0) {
    const combinedInput = `${instructions}

Extract ${extractorType} from the provided resume images.

Existing records to avoid duplicating:
${JSON.stringify(existingRecords, null, 2)}

Please analyze the resume images and extract any new ${extractorType} that don't already exist in the records above.`;

    try {
      const res = await sendMessages({
        input: combinedInput,
        name: extractorType,
        useVision: true,
        temperature: 0.1, // Low temperature for consistent extraction
      });

      return res[extractorType] || [];
    } catch (error) {
      console.error(
        `Error extracting ${extractorType} with vision API, falling back to text:`,
        error
      );
      // Fall through to text extraction below
    }
  }

  // Fallback to text extraction
  if (resume) {
    const combinedInput = `${instructions}

Extract ${extractorType} from this resume text:
${resume}

Existing records to avoid duplicating:
${JSON.stringify(existingRecords, null, 2)}

Please analyze the resume text and extract any new ${extractorType} that don't already exist in the records above.`;

    try {
      const res = await sendMessages({
        input: combinedInput,
        name: extractorType,
        useVision: false,
        temperature: 0.1, // Low temperature for consistent extraction
      });

      return res[extractorType] || [];
    } catch (error) {
      console.error(`Error extracting ${extractorType}:`, error);
      throw error;
    }
  }

  throw new Error(`No resume data provided for ${extractorType} extraction`);
};
