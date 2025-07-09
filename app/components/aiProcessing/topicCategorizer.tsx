import { topicsCategorizerPrompt } from "@/app/prompts/topicsCategorizer";
import { JobType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import { TopicType } from "@/app/utils/responseSchemas";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";
import { formatJobDescriptionForAI } from "@/app/utils/aiInteractionUtils";

export const topicsCategorizer = async ({
  job,
  keywords,
}: {
  job: JobType;
  keywords?: Array<string>;
}) => {
  const jobDescription = formatJobDescriptionForAI({ job });
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `Job description: ${jobDescription}. Key words: ${
      Array.isArray(keywords) ? keywords.join(", ") : ""
    }`,
  };
  const messagesForQualificationsReviewer: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, topicsCategorizerPrompt];
  let res = await sendMessages({
    messages: messagesForQualificationsReviewer,
    name: "topics",
  });

  return res.topics as TopicType[];
};
