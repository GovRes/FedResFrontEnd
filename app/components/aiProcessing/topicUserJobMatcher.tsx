import { topicUserJobMatcherPrompt } from "@/app/prompts/topicUserJobMatcherPrompt";
import { TopicType, UserJobType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const topicUserJobMatcher = async ({
  userJobs,
  topics,
}: {
  topics: TopicType[];
  userJobs: UserJobType[];
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `user's past jobs: ${JSON.stringify(
      userJobs
    )}. Topically organized keywords for job listing: ${JSON.stringify(
      topics
    )}.`,
  };
  const messagesForTopicUserJobMatcher: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, topicUserJobMatcherPrompt];
  let res = await sendMessages({
    messages: messagesForTopicUserJobMatcher,
    //has to match line 26 in api/ai/route.tsx
    name: "userJobs",
  });
  const result = res.userJobs as UserJobType[];
  return result;
};
