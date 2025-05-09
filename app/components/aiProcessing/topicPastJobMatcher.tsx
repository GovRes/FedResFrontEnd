import { topicPastJobMatcherPrompt } from "@/app/prompts/topicPastJobMatcherPrompt";
import { TopicType, PastJobType } from "@/app/utils/responseSchemas";
import { sendMessages } from "@/app/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const topicPastJobMatcher = async ({
  pastJobs,
  topics,
}: {
  topics: TopicType[];
  pastJobs: PastJobType[];
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `user's past jobs: ${JSON.stringify(
      pastJobs
    )}. Topically organized keywords for job listing: ${JSON.stringify(
      topics
    )}.`,
  };
  const messagesForTopicPastJobMatcher: (
    | ChatCompletionUserMessageParam
    | ChatCompletionSystemMessageParam
  )[] = [userMessage, topicPastJobMatcherPrompt];
  let res = await sendMessages({
    messages: messagesForTopicPastJobMatcher,
    //has to match line 26 in api/ai/route.tsx
    name: "pastJobs",
  });
  const result = res.PastJobs as PastJobType[];
  return result;
};
