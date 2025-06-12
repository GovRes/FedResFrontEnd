import { pastJobsExtractorPrompt } from "@/app/prompts/pastJobsExtractorPrompt";
import { PastJobType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const pastJobsExtractor = async ({
  existingPastJobs,
  resume,
}: {
  existingPastJobs: PastJobType[];
  resume: string;
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `resumes: ${resume}, past jobs: ${JSON.stringify(
      existingPastJobs
    )}`,
  };
  const messagesForPastJobsExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, pastJobsExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForPastJobsExtractor,
      //has to match line 26 in api/ai/route.tsx
      name: "pastJobs",
    });

    return res.pastJobs as PastJobType[];
  } catch (error) {
    console.error("Error extracting user jobs", error);
    throw error;
  } finally {
  }
};
