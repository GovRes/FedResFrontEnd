import { topicsCategorizerPrompt } from "@/app/prompts/topicsCategorizer";
import { JobType } from "@/app/providers";
import { sendMessages } from "@/app/utils/api";
import { TopicType } from "@/app/utils/responseSchemas";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const topicsCategorizer = async ({
  job,
  keywords,
  setLoading,
  setLoadingText,
}: {
  job?: JobType;
  keywords?: Array<string>;
  setLoading: Function;
  setLoadingText: Function;
}) => {
  setLoadingText("Organizing keywords into topics");
  setLoading(true);

  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `Job description: ${job}. Key words: ${
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
  setLoading(false);

  return res.topics as TopicType[];
};
