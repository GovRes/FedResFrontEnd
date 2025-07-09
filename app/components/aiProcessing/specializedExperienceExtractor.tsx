import { specializedExperienceExtractorPrompt } from "@/app/prompts/specializedExperienceExtractorPrompt";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import { JobType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const specializedExperienceExtractor = async ({
  job,
}: {
  job?: JobType;
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `Qualifications summary: ${job?.qualificationsSummary}`,
  };
  const messagesForSpecializedExperienceExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, specializedExperienceExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForSpecializedExperienceExtractor,
      name: "specializedExperiences",
    });

    return res.specializedExperiences as SpecializedExperienceType[];
  } catch (error) {
    console.error("Error extracting specialized experiences:", error);
    throw error;
  }
};
