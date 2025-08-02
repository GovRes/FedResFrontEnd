import { sendMessages } from "@/lib/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const genericExtractor = async ({
  resumeImages,
  resume,
  existingRecords,
  extractorType,
  systemPrompt,
}: {
  resumeImages?: string[];
  resume?: string;
  existingRecords: any[];
  extractorType: "pastJobs" | "education" | "awards" | "volunteers";
  systemPrompt: ChatCompletionSystemMessageParam;
}) => {
  // Use Vision API if images available, otherwise fall back to text
  if (resumeImages && resumeImages.length > 0) {
    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: [
        {
          type: "text",
          text: `Extract ${extractorType} from these resume images. Existing records to avoid duplicating: ${JSON.stringify(
            existingRecords
          )}`,
        },
        ...resumeImages.map((image) => ({
          type: "image_url" as const,
          image_url: { url: image },
        })),
      ],
    };

    try {
      const res = await sendMessages({
        messages: [systemPrompt, userMessage],
        name: extractorType,
        useVision: true,
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
    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: `Extract ${extractorType} from this resume: ${resume}. Existing records to avoid duplicating: ${JSON.stringify(
        existingRecords
      )}`,
    };

    try {
      const res = await sendMessages({
        messages: [systemPrompt, userMessage],
        name: extractorType,
        useVision: false,
      });

      return res[extractorType] || [];
    } catch (error) {
      console.error(`Error extracting ${extractorType}:`, error);
      throw error;
    }
  }

  throw new Error(`No resume data provided for ${extractorType} extraction`);
};
