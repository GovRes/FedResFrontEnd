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

  try {
    let res = await sendMessages({
      messages: messagesForTopicPastJobMatcher,
      name: "pastJobs",
    });
    // Parse and validate the response
    return res.pastJobs;
  } catch (error) {
    console.error("Response did not match expected schema:", error);
    // Handle validation failure - could return empty array, throw error, etc.
    return [];
  }
};
