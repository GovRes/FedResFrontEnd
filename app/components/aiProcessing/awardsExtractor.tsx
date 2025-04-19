import { awardsExtractorPrompt } from "@/app/prompts/awardsExtractorPrompt";
import { AwardType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const awardsExtractor = async ({
  resumes,
  setLoading,
  setLoadingText,
}: {
  resumes: string[];
  setLoading: Function;
  setLoadingText: Function;
}) => {
  setLoadingText("Extracting your awards from your resumes");
  setLoading(true);
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `resumes: ${resumes}`,
  };
  const messagesForUserJobsExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, awardsExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForUserJobsExtractor,
      //has to match line 26 in api/ai/route.tsx
      name: "awards",
    });

    return res.awards as AwardType[];
  } catch (error) {
    console.error("Error extracting awards", error);
    throw error;
  } finally {
    setLoading(false);
  }
};
