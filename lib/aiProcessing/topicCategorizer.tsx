import { topicsCategorizerPrompt } from "@/lib/prompts/topicsCategorizer";
import { JobType } from "@/lib/utils/responseSchemas";
import { sendMessages } from "@/lib/utils/api";
import { TopicType } from "@/lib/utils/responseSchemas";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";
import { formatJobDescriptionForAI } from "@/lib/utils/aiInteractionUtils";

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
  console.log("topicsCategorizer res:", res.topics);
  return res.topics as TopicType[];
};
