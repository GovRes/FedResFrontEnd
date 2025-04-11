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
  setLoading,
  setLoadingText,
}: {
  topics: TopicType[];
  userJobs: UserJobType[];
  setLoading: Function;
  setLoadingText: Function;
}) => {
  setLoadingText("matching future job requirements to past jobs");
  setLoading(true);
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
  try {
    console.log("sending");
    let res = await sendMessages({
      messages: messagesForTopicUserJobMatcher,
      //has to match line 26 in api/ai/route.tsx
      name: "userJobs",
    });
    console.log("received");

    return res.userJobs as UserJobType[];
  } catch (error) {
    console.error("Error extracting user jobs", error);
    throw error;
  } finally {
    setLoading(false);
  }
};
