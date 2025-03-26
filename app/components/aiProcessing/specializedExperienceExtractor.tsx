import { specializedExperienceExtractorPrompt } from "@/app/prompts/specializedExperienceExtractorPrompt";
import { SpecializedExperienceType } from "@/app/utils/responseSchemas";
import { JobType } from "@/app/providers";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const specializedExperienceExtractor = async ({
  job,
  setLoading,
  setLoadingText,
}: {
  job?: JobType;
  setLoading: Function;
  setLoadingText: Function;
}) => {
  setLoadingText("Reviewing job description for specialized experience.");
  setLoading(true);
  console.log(job);
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `Qualifications summary: ${job?.qualificationsSummary}`,
  };
  const messagesForSpecializedExperienceExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, specializedExperienceExtractorPrompt];
  let res = await sendMessages({
    messages: messagesForSpecializedExperienceExtractor,
    name: "specializedExperiences",
  });

  setLoading(false);
  return res.specializedExperiences as SpecializedExperienceType[];
};
