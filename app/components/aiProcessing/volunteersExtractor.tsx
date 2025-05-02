import { volunteersExtractorPrompt } from "@/app/prompts/volunteersExtractorPrompt";
import { UserJobType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const volunteersExtractor = async ({
  resumes,
}: {
  resumes: string[];
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `resumes: ${resumes}`,
  };
  const messagesForUserJobsExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, volunteersExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForUserJobsExtractor,
      //has to match line 26 in api/ai/route.tsx
      name: "userJobs",
    });

    return res.userJobs as UserJobType[];
  } catch (error) {
    console.error("Error extracting volunteer experiences", error);
    throw error;
  } finally {
  }
};
