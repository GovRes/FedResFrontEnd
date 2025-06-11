import { volunteersExtractorPrompt } from "@/app/prompts/volunteersExtractorPrompt";
import { PastJobType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const volunteersExtractor = async ({ resume }: { resume: string }) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `resumes: ${resume}`,
  };
  const messagesForPastJobsExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, volunteersExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForPastJobsExtractor,
      //has to match line 26 in api/ai/route.tsx
      name: "pastJobs",
    });

    return res.PastJobs as PastJobType[];
  } catch (error) {
    console.error("Error extracting volunteer experiences", error);
    throw error;
  } finally {
  }
};
