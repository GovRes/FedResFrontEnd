import { jobDescriptionKeywordFinderPrompt } from "@/lib/prompts/jobDescriptionKeywordFinder";
import { JobType } from "@/lib/utils/responseSchemas";
import { formatJobDescriptionForAI } from "@/lib/utils/aiInteractionUtils";
import { sendMessages } from "@/lib/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const jobDescriptionKeywordFinder = async ({
  job,
}: {
  job: JobType;
}) => {
  const jobDescription = formatJobDescriptionForAI({ job });
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: jobDescription,
  };
  const messages: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, jobDescriptionKeywordFinderPrompt];
  let res = await sendMessages({ messages, name: "keywords" });

  const result = res.keywords as Array<string>;
  return result;
};
