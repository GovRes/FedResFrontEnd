import { userJobsExtractorPrompt } from "@/app/prompts/userJobsExtractorPrompt";
import { UserJobType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const userJobsExtractor = async ({
  resumes,
  setLoading,
  setLoadingText,
}: {
  resumes: string[];
  setLoading: Function;
  setLoadingText: Function;
}) => {
  setLoadingText("Extracting your jobs from your resumes");
  setLoading(true);
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `resumes: ${resumes}`,
  };
  const messagesForUserJobsExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, userJobsExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForUserJobsExtractor,
      //has to match line 26 in api/ai/route.tsx
      name: "userJobs",
    });

    return res.userJobs as UserJobType[];
  } catch (error) {
    console.error("Error extracting user jobs", error);
    throw error;
  } finally {
    setLoading(false);
  }
};
