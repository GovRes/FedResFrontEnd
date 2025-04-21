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
  setLoading,
  setLoadingText,
}: {
  job: JobType;
  keywords?: Array<string>;
  setLoading: Function;
  setLoadingText: Function;
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
  setLoadingText("Organizing keywords into topics");
  setLoading(true);

  let res = await sendMessages({
    messages: messagesForQualificationsReviewer,
    name: "topics",
  });
  setLoading(false);

  return res.topics as TopicType[];
};
