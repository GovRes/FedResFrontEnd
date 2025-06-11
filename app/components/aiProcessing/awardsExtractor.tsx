import { awardsExtractorPrompt } from "@/app/prompts/awardsExtractorPrompt";
import { AwardType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const awardsExtractor = async ({ resume }: { resume: string }) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `resume: ${resume}`,
  };
  const messagesForAwardsExtractor: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, awardsExtractorPrompt];
  try {
    let res = await sendMessages({
      messages: messagesForAwardsExtractor,
      //has to match line 26 in api/ai/route.tsx
      name: "awards",
    });

    return res.awards as AwardType[];
  } catch (error) {
    console.error("Error extracting awards", error);
    throw error;
  } finally {
  }
};
