import { topicPastJobMatcherPrompt } from "@/lib/prompts/topicPastJobMatcherPrompt";
import { TopicType, PastJobType } from "@/lib/utils/responseSchemas";
import { sendMessages } from "@/lib/utils/api";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/index.mjs";

export const topicPastJobMatcher = async ({
  pastJobs,
  topic,
}: {
  topic: TopicType;
  pastJobs: PastJobType[];
}) => {
  const userMessage: ChatCompletionUserMessageParam = {
    role: "user",
    content: `user's past jobs: ${JSON.stringify(
      pastJobs
    )}. Topic with keywords keywords from job listing: ${JSON.stringify(
      topic
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
    console.log("response from topic matcher 34", res);
    // Parse and validate the response
    return res.pastJobs;
  } catch (error) {
    console.error("Response did not match expected schema:", error);
    // Handle validation failure - could return empty array, throw error, etc.
    return [];
  }
};
